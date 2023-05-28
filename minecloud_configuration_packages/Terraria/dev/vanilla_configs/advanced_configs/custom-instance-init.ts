import {
  InitCommand,
  InitConfig,
  InitFile,
  InitPackage
} from 'aws-cdk-lib/aws-ec2';
import { MINECLOUD_SERVER_DIR } from '../../lib/const/minecloud-dir';
import { DEPLOY_LOCAL_SERVER_EXECUTABLE } from '../MineCloud-Configs';

const TERRARIA_SERVER_DOWNLOAD_URL =
  'https://terraria.org/api/download/pc-dedicated-server/terraria-server-1449.zip';

export const CUSTOM_INIT_CONFIG: InitConfig = getCustomInitConfig();

function getCustomInitConfig(): InitConfig {

  if (!DEPLOY_LOCAL_SERVER_EXECUTABLE) {
    // Download and setup Terraria server
    return new InitConfig([
      InitFile.fromUrl(
        `${MINECLOUD_SERVER_DIR}/terraria-server-1449.zip`,
        TERRARIA_SERVER_DOWNLOAD_URL
      ),
      InitCommand.shellCommand(`sudo unzip terraria-server-1449.zip`, {
        cwd: MINECLOUD_SERVER_DIR
      }),
      InitCommand.shellCommand(`sudo rm -f terraria-server-1449.zip`, {
        cwd: MINECLOUD_SERVER_DIR
      }),
      InitCommand.shellCommand(`sudo mv 1449/Linux/* .`, {
        cwd: MINECLOUD_SERVER_DIR
      }),
      InitCommand.shellCommand(`sudo rm -rf 1449`, {
        cwd: MINECLOUD_SERVER_DIR
      }),
      InitCommand.shellCommand(`sudo chmod +x TerrariaServer.bin.x86*`, {
        cwd: MINECLOUD_SERVER_DIR
      }),
      InitFile.fromFileInline(`${MINECLOUD_SERVER_DIR}/serverconfig.txt`,'minecloud_configs/advanced_configs/serverconfig.txt')
    ]);
  } else {
    return new InitConfig([
      InitCommand.shellCommand(`sudo chmod +x TerrariaServer.bin.x86*`, {
        cwd: MINECLOUD_SERVER_DIR
      })
    ]);
  }
}
