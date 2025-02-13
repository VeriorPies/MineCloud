import { Construct } from 'constructs';
import { SpotInstance } from './spot-instance';
import {
  CfnOutput,
  CustomResource,
  Duration,
  Stack,
  StackProps,
  Tags
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
  EC2_INSTANCE_TYPE,
  MAX_PRICE,
  EC2_VOLUME,
  EC2_INIT_TIMEOUT,
  STACK_NAME
} from '../minecloud_configs/MineCloud-Configs';

import {
  DISCORD_PUBLIC_KEY,
  DISCORD_APP_ID,
  DISCORD_BOT_TOKEN
} from '../MineCloud-Service-Info';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { getInitConfig } from './instance-init';
import { v4 } from 'uuid';
import { PORT_CONFIGS } from '../minecloud_configs/advanced_configs/port-configs';
import { IGNORE_FAILURE_ON_INSTANCE_INIT } from '../minecloud_configs/advanced_configs/other-configs';

export const STACK_PREFIX = STACK_NAME;

import {
  DOMAIN_NAME
} from '../MineCloud-Service-Info';
import route53 = require('aws-cdk-lib/aws-route53');

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
          discordAppId: DISCORD_APP_ID,
          discordPublicKey: DISCORD_PUBLIC_KEY,
          backUpBucket: this.backupBucket
        }
      );
    this.discordInteractionsEndpointLambda.node.addDependency(this.ec2Instance);
    this.discordInteractionsEndpointURL = new CfnOutput(
      this,
      `Discord-Interaction-End-Point-Url`,
      {
        description:
          'Copy and paste this to the "INTERACTIONS ENDPOINT URL" field on Discord developer portal.',
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
    // To allow SSH connections
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

    const spotInstance = new SpotInstance(this, `${STACK_PREFIX}_ec2_instance`, {
      vpc: defaultVPC,
      keyName: sshKeyPair.keyName,
      role: ec2Role,
      // vpcSubnets: {
      //   // Place in a public subnet in-order to have a public ip address
      //   subnetType: SubnetType.PUBLIC
      // },
      securityGroup: securityGroup,
      instanceType: new InstanceType(EC2_INSTANCE_TYPE),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2023
      }),
      templateId: `${STACK_PREFIX}_ec2_launch_template`,
      launchTemplateSpotOptions: {
        interruptionBehavior: SpotInstanceInterruption.STOP,
        requestType: SpotRequestType.PERSISTENT,
        maxPrice: MAX_PRICE
      },
      initOptions: {
        ignoreFailures: IGNORE_FAILURE_ON_INSTANCE_INIT,
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

    // Optional: do all the DNS related stuff only when a DOMAIN_NAME parameter is set
    if (DOMAIN_NAME) {

      // get a reference to the existing hosted zone
      const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: DOMAIN_NAME })

      // add permission to describe tags of an EC2 instance and lookup hosted zones by DNS domain name
      ec2Role.addToPolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'ec2:DescribeTags',
            'route53:ListHostedZonesByName'
          ],
          resources: ['*']
        })
      );
      // add permission to update the DNS record
      ec2Role.addToPolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "route53:ChangeResourceRecordSets"
          ],
          resources: ['arn:aws:route53:::hostedzone/' + zone.hostedZoneId]
        })
      );

      const DNS_NAME = 'minecloud' // variable to make it overridable in the future

      // create a dummy record which we can update during server start
      // TODO: https://github.com/aws/aws-cdk/issues/4155
      // It seems as if the Arecord does not get deleted upon CDK destroy
      // in that case we could simply re-use the old entry until the issue gets fixed
      // is it possible that the record cannot be deleted when its value gets updated externally?
      const aliasRecord = new route53.ARecord(this, 'MyARecord', {
          target: { 
            values: ['192.168.0.1'],
          },
          recordName: DNS_NAME + '.' + DOMAIN_NAME,
          zone: zone,
        });

      // Add the DOMAIN_NAME as a tag to the EC2 instance to pass the value to the machine
      Tags.of(spotInstance).add('DOMAIN_NAME', DOMAIN_NAME);
    }
    
    return spotInstance;
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
        },
        timeout: Duration.seconds(30)
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
