import { Construct } from 'constructs';
import { SpotInstance } from './spot-instance';
import {
  CfnOutput,
  CustomResource,
  Duration,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  BlockDeviceVolume,
  CfnKeyPair,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SpotInstanceInterruption,
  SpotRequestType,
  SubnetType,
  Vpc
} from 'aws-cdk-lib/aws-ec2';
import { DiscordInteractionsEndpointConstruct } from './discord-interactions-endpoint-construct';
import * as cr from 'aws-cdk-lib/custom-resources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import path = require('path');
import {
  DISCORD_PUBLIC_KEY,
  DISCORD_APP_ID,
  DISCORD_BOT_TOKEN,
  EC2_INSTANCE_TYPE,
  MAX_PRICE,
  EC2_VOLUME,
  EC2_INIT_TIMEOUT
} from '../minecloud_configs/MineCloud-Configs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { getInitConfig } from './instance-init';
import { v4 } from 'uuid';
import { PORT_CONFIGS } from '../minecloud_configs/advanced_configs/port-configs';

export const STACK_PREFIX = 'MineCloud';

export class MineCloud extends Stack {
  readonly ec2Instance;

  readonly discordInteractionsEndpointLambda;
  readonly discordInteractionsEndpointURL: CfnOutput;

  readonly discordCommandRegisterResource: CustomResource;

  readonly backupBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // setup backup S3 bucket
    const backUpBucketName = `mc-backup-${v4()}`;
    this.backupBucket = new Bucket(this, `${STACK_PREFIX}_backup_s3_bucket`, {
      bucketName: backUpBucketName
    });

    // setup EC2 instance
    this.ec2Instance = this.setupEC2Instance(backUpBucketName);
    this.backupBucket.grantReadWrite(this.ec2Instance);

    // register Discord commands
    this.discordCommandRegisterResource = this.setupDiscordCommands();

    // setup discord interaction end points
    this.discordInteractionsEndpointLambda =
      new DiscordInteractionsEndpointConstruct(
        this,
        `${STACK_PREFIX}_discord_interactions_endpoint_construct`,
        {
          instanceId: this.ec2Instance.instanceId,
          ec2Region: this.region,
          discordPublicKey: DISCORD_PUBLIC_KEY
        }
      );
    this.discordInteractionsEndpointLambda.node.addDependency(this.ec2Instance);
    this.discordInteractionsEndpointURL = new CfnOutput(
      this,
      `Discord-Interaction-End-Point-Url`,
      {
        description: 'Copy and paste this to the Discord developer portal.',
        value: this.discordInteractionsEndpointLambda.lambdaFunctionURL.url
      }
    );
  }

  setupEC2Instance(backupBucketName: string): SpotInstance {
    const defaultVPC = Vpc.fromLookup(this, `${STACK_PREFIX}_vpc`, {
      isDefault: true
    });

    const ec2Role = new Role(this, `${STACK_PREFIX}_ec2_instance_role`, {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com')
    });

    // To enable SSM service
    ec2Role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:*', 'ssmmessages:*', 'ec2messages:*'],
        resources: ['*']
      })
    );

    const securityGroup = new SecurityGroup(
      this,
      `${STACK_PREFIX}_ec2_security_group`,
      {
        vpc: defaultVPC,
        allowAllOutbound: true,
        securityGroupName: `${STACK_PREFIX}_ec2_security_group`
      }
    );
    // To allow SSH and minecloud connections
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'Allows SSH connection'
    );

    for (const config of PORT_CONFIGS) {
      securityGroup.addIngressRule(
        config.peer,
        config.port,
        config.description
      );
    }

    // Key pair for ssh-ing into EC2 instance from aws console
    const sshKeyPair = new CfnKeyPair(this, `${STACK_PREFIX}_ec2_key_pair`, {
      keyName: `${STACK_PREFIX}_ec2_key`
    });

    return new SpotInstance(this, `${STACK_PREFIX}_ec2_instance`, {
      vpc: defaultVPC,
      keyName: sshKeyPair.keyName,
      role: ec2Role,
      vpcSubnets: {
        // Place in a public subnet in-order to have a public ip address
        subnetType: SubnetType.PUBLIC
      },
      securityGroup: securityGroup,
      instanceType: new InstanceType(EC2_INSTANCE_TYPE),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      templateId: `${STACK_PREFIX}_ec2_launch_template`,
      launchTemplateSpotOptions: {
        interruptionBehavior: SpotInstanceInterruption.STOP,
        requestType: SpotRequestType.PERSISTENT,
        maxPrice: MAX_PRICE
      },
      initOptions: {
        ignoreFailures: false,
        timeout: Duration.minutes(EC2_INIT_TIMEOUT),
        configSets: ['default']
      },
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: BlockDeviceVolume.ebs(EC2_VOLUME)
        }
      ],
      // Note:
      // Making changes to init config will replace the old EC2 instance and
      // WILL RESULT IN DANGLING SPOT REQUEST AND EC2 INSTANCE
      // (YOU'LL NEED TO MANUALLY CANCEL THE DANGLING SPOT REQUEST TO AVOID SPINNING UP ADDITIONAL EC2 INSTANCE)
      init: getInitConfig(backupBucketName)
    });
  }

  setupDiscordCommands(): CustomResource {
    const role = new Role(
      this,
      `${STACK_PREFIX}_discord_command_register_lambda_role`,
      { assumedBy: new ServicePrincipal('lambda.amazonaws.com') }
    );

    const lambda = new NodejsFunction(
      this,
      `${STACK_PREFIX}_discord_commands_register_lambda`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: 'index.handler',
        entry: path.join(
          __dirname,
          '/../lambda/discord_commands_register/index.ts'
        ),
        environment: {
          APP_ID: DISCORD_APP_ID,
          BOT_TOKEN: DISCORD_BOT_TOKEN
        }
      }
    );

    const provider = new cr.Provider(
      this,
      `${STACK_PREFIX}_discord_commands_register_provider`,
      {
        onEventHandler: lambda,
        role: role
      }
    );

    const customResource = new CustomResource(
      this,
      `${STACK_PREFIX}_discord_commands_register_resource`,
      {
        serviceToken: provider.serviceToken
      }
    );
    return customResource;
  }
}
