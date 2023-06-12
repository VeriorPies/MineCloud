import {
  InitCommand,
  InitConfig,
  InitFile,
  InitPackage
} from 'aws-cdk-lib/aws-ec2';
import { MINECLOUD_SERVER_DIR } from '../../lib/const/minecloud-dir';
import { STEAM_CMD_INIT } from './steamcmd-init';
import { VALHEIM_PASSWORD, VALHEIM_SERVER_NAME, VALHEIM_WORLD } from './valheim-server-settings';

export const CUSTOM_INIT_CONFIG: InitConfig = getCustomInitConfig();

function setUpShellScript(
  targetDir: string,
  targetFileName: string,
  localFilePath: string
) {
  return [
    InitFile.fromFileInline(`${targetDir}/${targetFileName}`, localFilePath),
    InitCommand.shellCommand(`sudo chmod +x ${targetFileName}`, {
      cwd: targetDir
    }),
    // To convert Windows's EOL to Linux
    InitCommand.shellCommand(`sed -i 's/\r//' ${targetFileName}`, {
      cwd: targetDir
    })
  ];
}

function setUpEnviromentVariable(name: string, value: string) {
  return [
    InitCommand.shellCommand(`echo '${name}=${value}' >> /etc/environment`)
  ];
}

function getCustomInitConfig(): InitConfig {
  let configs: (InitPackage | InitCommand | InitFile)[] = [
    ...STEAM_CMD_INIT,
    InitFile.fromFileInline(
      '/home/ec2-user/valheim/start_valheim_server.sh',
      'minecloud_configs/advanced_configs/start_valheim_server.sh'
    ),
    InitCommand.shellCommand(`sudo chmod +x start_valheim_server.sh`,{
      cwd: '/home/ec2-user/valheim'
    }),
    InitCommand.shellCommand(`chown ec2-user:ec2-user start_valheim_server.sh`,{
      cwd: '/home/ec2-user/valheim'
    }),
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
