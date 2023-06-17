import { Peer, Port } from 'aws-cdk-lib/aws-ec2';

export const PORT_CONFIGS = [
  {
    peer: Peer.anyIpv4(),
    port: Port.udp(2456),
    description: 'Game Port'
  },
  {
    peer: Peer.anyIpv4(),
    port: Port.udp(2457),
    description: 'Steam Query Port'
  },
  {
    peer: Peer.anyIpv4(),
    port: Port.udp(2458),
    description: ''
  }
];
