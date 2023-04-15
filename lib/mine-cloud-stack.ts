import { Construct } from "constructs";
import { SpotInstance } from "./spot-instance";
import { CfnOutput, CustomResource, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  CfnKeyPair,
  CloudFormationInit,
  InitCommand,
  InitConfig,
  InitFile,
  InitGroup,
  InitPackage,
  InitService,
  InitServiceRestartHandle,
  InitUser,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  ServiceManager,
  SpotInstanceInterruption,
  SpotRequestType,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { DiscordInteractionsEndpointConstruct } from './discord-interactions-endpoint-construct';
import * as cr from 'aws-cdk-lib/custom-resources'
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path = require("path");
import { DISCORD_PUBLIC_KEY, DISCORD_APP_ID, DISCORD_BOT_TOKEN, EC2_INSTANCE_TYPE, MAX_PRICE } from "../minecloud_configs/MineCloud-Configs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { INTANCE_INIT_CONFIG } from "./instance-init";

export const STACK_PREFIX = 'MineCloud';

export class MineCloud extends Stack {

  readonly ec2Instance;
  
  readonly discordInteractionsEndpointLambda;
  readonly discordInteractionsEndpointURL: CfnOutput;
  
  readonly discordCommandRegisterResource: CustomResource;
  
  readonly backBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // setup EC2 instance
    this.ec2Instance = this.setupEC2Instance();

    // register Discord commands
    this.discordCommandRegisterResource = this.setupDiscordCommands();

    // setup discord interaction end points
    this.discordInteractionsEndpointLambda = new DiscordInteractionsEndpointConstruct(
      this,  
      `${STACK_PREFIX}_discord_interactions_endpoint_construct`,
      {
        instanceId: this.ec2Instance.instanceId,
        region: this.region,
        discordPublicKey: DISCORD_PUBLIC_KEY
      }
    );
    this.discordInteractionsEndpointLambda.node.addDependency(this.ec2Instance);
    this.discordInteractionsEndpointURL = new CfnOutput(this, 'DISCORD-INTERACTIONS-ENDPOINT-URL', { 
      value: this.discordInteractionsEndpointLambda.lambdaFunctionURL.url });
    
    // setup backup S3 bucket
    this.backBucket = new Bucket(this, `${STACK_PREFIX}_backup_s3_bucket`, {
      bucketName: `${STACK_PREFIX.toLowerCase()}-backup-bucket`
    });
    this.backBucket.grantReadWrite(this.ec2Instance);
  }

  setupEC2Instance(): SpotInstance {
    const defaultVPC = Vpc.fromLookup(this,  `${STACK_PREFIX}_vpc`,{isDefault: true});

    const ec2Role = new Role(
      this,
      `${STACK_PREFIX}_ec2_instance_role`,
      { assumedBy: new ServicePrincipal('ec2.amazonaws.com') }
    );
    
    // To enable SSM service
    ec2Role.addToPolicy(new PolicyStatement(
      {
        effect: Effect.ALLOW,
        actions: ["ssm:*", "ssmmessages:*", "ec2messages:*"],
        resources: ["*"],
      }
    ));


    const securityGroup = new SecurityGroup(
      this,
      `${STACK_PREFIX}_ec2_security_group`,
      {
        vpc: defaultVPC,
        allowAllOutbound: true,
        securityGroupName: `${STACK_PREFIX}_ec2_security_group`,
      }
    )
    // To allow SSH and minecraft connections
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'Allows SSH connection'
    )
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(25565),
      'Allows Minecraft connection'
    )
    
    // Key pair for ssh-ing into EC2 instance from aws console
    const sshKeyPair = new CfnKeyPair(this, `${STACK_PREFIX}_ec2_key_pair`, {
      keyName: `${STACK_PREFIX}_ec2_key`});
      
    return new SpotInstance(this, `${STACK_PREFIX}_ec2_instance`, {
      vpc: defaultVPC,
      keyName: sshKeyPair.keyName,
      role: ec2Role,
      vpcSubnets: {
        // Place in a public subnet in-order to have a public ip address
        subnetType: SubnetType.PUBLIC
      },
      securityGroup: securityGroup,
      instanceType: EC2_INSTANCE_TYPE,
      machineImage: new AmazonLinuxImage({generation: AmazonLinuxGeneration.AMAZON_LINUX_2}),
      templateId: `${STACK_PREFIX}_ec2_launch_template`,
      launchTemplateSpotOptions:{
        interruptionBehavior: SpotInstanceInterruption.STOP,
        requestType: SpotRequestType.PERSISTENT,
        maxPrice: MAX_PRICE,
      },
      initOptions: {
        ignoreFailures: false,
        timeout: Duration.minutes(10),
        configSets: ["default"],
      },
      // Note: 
      // Making changes to init config will replace the old EC2 instance and 
      // WILL RESULT IN DANGLING SPOT REQUEST AND EC2 INSTANCE 
      // (YOU'LL NEED TO MANUALLY CANCEL THE DANGLING SPOT REQUEST TO AVOID SPINNING UP ADDITIONAL EC2 INSTANCE)
      init: INTANCE_INIT_CONFIG,
    });
  }

  setupDiscordCommands(): CustomResource{
    const role = new Role(
      this,
      `${STACK_PREFIX}_discord_command_register_lambda_role`,
      { assumedBy: new ServicePrincipal('lambda.amazonaws.com') }
    );

    const lambda = new NodejsFunction(this, `${STACK_PREFIX}_discord_commands_register_lambda`, {
      runtime: Runtime.NODEJS_14_X, // We will want to upgrade this later
      handler: 'index.handler',
      entry: path.join(__dirname, '/../lambda/discord_commands_register/index.ts'),
      environment:{
        APP_ID: DISCORD_APP_ID,
        BOT_TOKEN: DISCORD_BOT_TOKEN
      }
    });

    const provider = new cr.Provider(this, `${STACK_PREFIX}_discord_commands_register_provider`, {
      onEventHandler: lambda,   
      role: role, 
    });

    const customResource = new CustomResource(this, `${STACK_PREFIX}_discord_commands_register_resource`, {
      serviceToken: provider.serviceToken,
    });
    return customResource;
  }
}
