import {
  InitCommand,
  InitConfig,
  InitFile,
  InitPackage
} from 'aws-cdk-lib/aws-ec2';
import { MINECLOUD_SERVER_DIR } from '../../lib/const/minecloud-dir';
import { DEPLOY_LOCAL_SERVER_EXECUTABLE } from '../MineCloud-Configs';
import { FACTORIO_SERVER_DOWNLOAD_URL } from './factorio-server-download-url';

export const CUSTOM_INIT_CONFIG: InitConfig = getCustomInitConfig();

function getCustomInitConfig(): InitConfig {

  if (DEPLOY_LOCAL_SERVER_EXECUTABLE) {
    return new InitConfig([]);
  }

  let configs: (InitCommand | InitFile)[] = [
    InitFile.fromUrl(
        `${MINECLOUD_SERVER_DIR}/factorio_headless.tar.xz`,
        FACTORIO_SERVER_DOWNLOAD_URL
    ),
    InitCommand.shellCommand(`sudo tar -xJf factorio_headless.tar.xz`, {
          cwd: MINECLOUD_SERVER_DIR
    }),
    InitCommand.shellCommand(`sudo ./factorio/bin/x64/factorio --create ./saves/my-save.zip`, {
      cwd: MINECLOUD_SERVER_DIR
    })
  ];
  
  return new InitConfig(configs);
}
