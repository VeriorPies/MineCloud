import { Construct } from 'constructs';
import { SpotInstance } from './spot-instance';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { AmazonLinuxGeneration, AmazonLinuxImage, CfnKeyPair, InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SpotInstanceInterruption, SpotRequestType, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DiscordInteractionsEndpointConstruct } from './discord-interactions-endpoint-construct';


export const STACK_PREFIX = 'MineCloud';

const MAX_PRICE = 0.1; // EC2 max price
const EC2_INSTANCE_TYPE = InstanceType.of(
  InstanceClass.T2,
  InstanceSize.LARGE
);
const DISCORD_PUBLIC_KEY = "";

export class MineCloud extends Stack {

  readonly ec2Instance;
  readonly  discordInteractionsEndpointLambda;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.ec2Instance = this.setupEC2Instance();
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
  }

  setupEC2Instance(): SpotInstance {
    const vpc = new Vpc(this, `${STACK_PREFIX}_VPC`);
    
    const ec2Role = new Role(
      this,
      `${STACK_PREFIX}_ec2_instance_role`,
      { assumedBy: new ServicePrincipal('ec2.amazonaws.com') }
    );

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
    });
  }
}
