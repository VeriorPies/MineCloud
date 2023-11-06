import {
  InitCommand,
  InitConfig,
  InitFile,
  InitPackage
} from 'aws-cdk-lib/aws-ec2';
import { MINECLOUD_SERVER_DIR } from '../../lib/const/minecloud-dir';
import { DEPLOY_LOCAL_SERVER_EXECUTABLE } from '../MineCloud-Configs';
import { MINECRAFT_SERVER_DOWNLOAD_URL } from './minecraft-server-download-url';

export const CUSTOM_INIT_CONFIG: InitConfig = getCustomInitConfig();

function getCustomInitConfig(): InitConfig {
  const configs: (InitPackage | InitCommand | InitFile)[] = [
    // Install an Amazon Java package using yum
    InitPackage.yum('java-17-amazon-corretto-headless'),
    InitCommand.shellCommand("echo 'eula=true' > eula.txt", {
      cwd: MINECLOUD_SERVER_DIR
    })
  ];

  if (!DEPLOY_LOCAL_SERVER_EXECUTABLE) {
    configs.push(
      InitFile.fromUrl(
        `${MINECLOUD_SERVER_DIR}/server.jar`,
        MINECRAFT_SERVER_DOWNLOAD_URL
      )
    );
  }

  return new InitConfig(configs);
}
