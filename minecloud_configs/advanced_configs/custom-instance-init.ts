import { InitCommand, InitConfig, InitFile, InitPackage } from 'aws-cdk-lib/aws-ec2';
import { MINECLOUD_SERVER_DIR } from '../../lib/const/minecloud-dir';


const MINECRAFT_SERVER_DOWNLOAD_URL = 'https://piston-data.mojang.com/v1/objects/8f3112a1049751cc472ec13e397eade5336ca7ae/server.jar';

export const CUSTOM_INIT_CONFIG: InitConfig = new InitConfig([
  // Install an Amazon Linux package using yum
  InitPackage.yum('java-17-amazon-corretto-headless'),
  InitCommand.shellCommand(
    "echo 'eula=true' > eula.txt",
    {
      cwd: MINECLOUD_SERVER_DIR,
    }
  ),
  InitFile.fromUrl(`${MINECLOUD_SERVER_DIR}/server.jar`, MINECRAFT_SERVER_DOWNLOAD_URL),
]);
