import { InitConfig, InitPackage } from 'aws-cdk-lib/aws-ec2';

export const CUSTOM_INIT_CONFIG: InitConfig = new InitConfig([
  // Install an Amazon Linux package using yum
  InitPackage.yum('java-17-amazon-corretto-headless')
]);
