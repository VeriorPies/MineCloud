import {
  InitCommand,
  InitConfig,
  InitFile,
  InitPackage
} from 'aws-cdk-lib/aws-ec2';
import { MINECLOUD_SERVER_DIR } from '../../lib/const/minecloud-dir';
import { STEAM_CMD_INIT } from '../../shared_lib/steamcmd-init';
import { VALHEIM_PASSWORD, VALHEIM_SERVER_NAME, VALHEIM_WORLD } from '../valheim-server-settings';
import { setUpEnviromentVariable, setUpShellScript } from '../../shared_lib/minecloud-utilities';

export const CUSTOM_INIT_CONFIG: InitConfig = getCustomInitConfig();

function getCustomInitConfig(): InitConfig {
  let configs: (InitPackage | InitCommand | InitFile)[] = [
    ...STEAM_CMD_INIT,
    ...setUpShellScript('/opt/minecloud/server/ValheimServer', 'start_valheim_server.sh', 'minecloud_configs/advanced_configs/start_valheim_server.sh'),
    ...setUpShellScript(MINECLOUD_SERVER_DIR, 'InstallUpdate.sh', 'minecloud_configs/advanced_configs/InstallUpdate.sh'),
    InitCommand.shellCommand(`chown -R ec2-user:ec2-user ${MINECLOUD_SERVER_DIR}`,{
      cwd: MINECLOUD_SERVER_DIR
    }),
    InitCommand.shellCommand(`runuser -u ec2-user ./InstallUpdate.sh`,{
      cwd: MINECLOUD_SERVER_DIR
    }),
    ...setUpEnviromentVariable("VALHEIM_SERVER_NAME", VALHEIM_SERVER_NAME),
    ...setUpEnviromentVariable("VALHEIM_WORLD", VALHEIM_WORLD),
    ...setUpEnviromentVariable("VALHEIM_PASSWORD", VALHEIM_PASSWORD)
  ];

  return new InitConfig(configs);
}
