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
import { DISCORD_PUBLIC_KEY, DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_CHANNEL_WEB_HOOK } from "../MineCloud-Configs";

export const STACK_PREFIX = 'MineCloud';

const MAX_PRICE = 0.1; // EC2 max price
const EC2_INSTANCE_TYPE = InstanceType.of(
  InstanceClass.T2,
  InstanceSize.LARGE
);

const MINECRAFT_USER = "minecraft";
// Not the same name since cfn-init can't figure it out for some reason
const MINECRAFT_GROUP = "minecraft-group";
const MINECRAFT_BASE_DIR = "/opt/minecraft";
const MINECRAFT_SERVER_DIR = `${MINECRAFT_BASE_DIR}/server`;



export class MineCloud extends Stack {

  readonly ec2Instance;
  
  readonly discordInteractionsEndpointLambda;
  readonly discordInteractionsEndpointURL: CfnOutput;
  
  readonly discordCommandRegisterResource: CustomResource;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.ec2Instance = this.setupEC2Instance();
    this.discordCommandRegisterResource = this.setupDiscordCommands();

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
  }

  setupEC2Instance(): SpotInstance {
    const vpc = new Vpc(this, `${STACK_PREFIX}_VPC`);
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
        vpc: vpc,
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
      vpc: vpc,
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
      // use init over user data commands since changes to user data will replace the EC2 instance...
      init: this.getInstanceInit(),
    });
  }

  getInstanceInit(): CloudFormationInit {
    const handle = new InitServiceRestartHandle();

    return CloudFormationInit.fromConfigSets({
      configSets: {
        default: [
          "yumPreinstall",
          "minecraftServerJarSetup",
          "createEula",
          "setupDiscordMessaging",
          "createMinecraftService",
          "startMinecraftService",
          "setupAutoShutdown"
        ],
      },
      configs: {
        yumPreinstall: new InitConfig([
          // Install an Amazon Linux package using yum
          InitPackage.yum("java-17-amazon-corretto-headless"),
        ]),
        minecraftServerJarSetup: new InitConfig([
          InitGroup.fromName(MINECRAFT_GROUP),
          InitUser.fromName(MINECRAFT_USER, {
            groups: [MINECRAFT_GROUP],
          }),

          // Setup directories
          InitCommand.shellCommand(`mkdir -p ${MINECRAFT_SERVER_DIR}`),
          InitCommand.shellCommand(
            "wget https://piston-data.mojang.com/v1/objects/8f3112a1049751cc472ec13e397eade5336ca7ae/server.jar",
            {
              cwd: MINECRAFT_SERVER_DIR,
            }
          ),
          InitCommand.shellCommand(
            `chown -R ${MINECRAFT_USER}:${MINECRAFT_GROUP} ${MINECRAFT_BASE_DIR}`
          ),
        ]),
        setupDiscordMessaging: new InitConfig([
          InitCommand.shellCommand(
            `echo 'DISCORD_WEB_HOOK=${DISCORD_CHANNEL_WEB_HOOK}' >> /etc/environment`
          ),
          InitFile.fromFileInline(`${MINECRAFT_BASE_DIR}/send_discord_message_to_webhook.sh`,'server_init_assets/send_discord_message_to_webhook.sh'),
          InitCommand.shellCommand(`sudo chmod +x send_discord_message_to_webhook.sh`, {cwd: MINECRAFT_BASE_DIR}),
        ]),
        createMinecraftService: new InitConfig([
          InitFile.fromFileInline(`${MINECRAFT_BASE_DIR}/start_service.sh`,'server_init_assets/start_service.sh'),
          InitCommand.shellCommand(`sudo chmod +x start_service.sh`, {cwd: MINECRAFT_BASE_DIR}),
          InitFile.fromFileInline('/etc/systemd/system/minecraft.service','server_init_assets/minecraft.service'),
        ]),
        startMinecraftService: new InitConfig([
          InitCommand.shellCommand("systemctl enable minecraft.service"),
          InitCommand.shellCommand("systemctl start minecraft.service"),
        ]),
        // Currently unused
        editEula: new InitConfig([
          InitCommand.shellCommand(
            "sed -i 's/^eula=false$/eula=true/g' eula.txt",
            {
              cwd: MINECRAFT_SERVER_DIR,
            }
          ),
        ]),
        createEula: new InitConfig([
          InitCommand.shellCommand(
            "echo 'eula=true' > eula.txt",
            {
              cwd: MINECRAFT_SERVER_DIR,
            }
          ),
        ]),
        setupAutoShutdown: new InitConfig([
          InitFile.fromFileInline(`${MINECRAFT_BASE_DIR}/check_user_conn.sh`,'server_init_assets/check_user_conn.sh'),
          InitCommand.shellCommand(`sudo chmod +x check_user_conn.sh`, {cwd: MINECRAFT_BASE_DIR}),
          // Setup crontab scheduler, run every 30 min
          InitCommand.shellCommand(`(crontab -l 2>/dev/null; echo "*/2 * * * * ${MINECRAFT_BASE_DIR}/check_user_conn.sh") | crontab -`),
        ])
      },
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
