import { Peer, Port } from 'aws-cdk-lib/aws-ec2';

export const PORT_CONFIGS = [
  {
    peer: Peer.anyIpv4(),
    port: Port.tcp(7777),
    description: 'Allows Terraria connection'
  }
];
