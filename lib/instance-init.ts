import {
  CloudFormationInit,
  InitCommand,
  InitConfig,
  InitFile,
  InitGroup,
  InitUser
} from 'aws-cdk-lib/aws-ec2';

import {
  BACKUP_INTERVAL_IN_SECONDS,
  DEPLOY_LOCAL_SERVER_EXECUTABLE,
  MAX_BACKUP_COUNT
} from '../minecloud_configs/MineCloud-Configs';
import { DISCORD_CHANNEL_WEB_HOOK } from '../MineCloud-Service-Info';

import { CUSTOM_INIT_CONFIG } from '../minecloud_configs/advanced_configs/custom-instance-init';
import {
  MINECLOUD_BASE_DIR,
  MINECLOUD_SERVER_DIR
} from './const/minecloud-dir';

const MINECLOUD_USER = 'minecloud';
// Not the same name since cfn-init can't figure it out for some reason
const MINECLOUD_GROUP = 'minecloud-group';

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

export function getInitConfig(backupBucketName: string) {
  return CloudFormationInit.fromConfigSets({
    configSets: {
      default: [
        DEPLOY_LOCAL_SERVER_EXECUTABLE
          ? 'deployLocalServerExecutable'
          : 'noAction',
        'customInit',
        'setupServerUtilities',
        'setupDiscordMessaging',
        'setupMineCloudService',
        'setupBackupScripts',
        'setupAutoShutdown'
      ]
    },
    configs: {
      deployLocalServerExecutable: new InitConfig([
        // Setup server executables
        InitFile.fromAsset(
          `${MINECLOUD_SERVER_DIR}/server.zip`,
          'minecloud_configs/server/server.zip'
        ),
        InitCommand.shellCommand(`sudo unzip server.zip`, {
          cwd: MINECLOUD_SERVER_DIR
        }),
        InitCommand.shellCommand(`sudo rm -f server.zip`, {
          cwd: MINECLOUD_SERVER_DIR
        })
      ]),
      customInit: CUSTOM_INIT_CONFIG,
      setupServerUtilities: new InitConfig([
        InitGroup.fromName(MINECLOUD_GROUP),
        InitUser.fromName(MINECLOUD_USER, {
          groups: [MINECLOUD_GROUP]
        }),

        // Setup directories
        InitCommand.shellCommand(`mkdir -p ${MINECLOUD_SERVER_DIR}`),

        // Setup server start/stop scripts
        ...setUpShellScript(
          MINECLOUD_SERVER_DIR,
          'start_server.sh',
          'minecloud_configs/server/start_server.sh'
        ),
        ...setUpShellScript(
          MINECLOUD_SERVER_DIR,
          'stop_server.sh',
          'minecloud_configs/server/stop_server.sh'
        ),

        InitCommand.shellCommand(
          `chown -R ${MINECLOUD_USER}:${MINECLOUD_GROUP} ${MINECLOUD_BASE_DIR}`
        )
      ]),
      setupDiscordMessaging: new InitConfig([
        ...setUpEnviromentVariable(
          'DISCORD_WEB_HOOK',
          DISCORD_CHANNEL_WEB_HOOK
        ),
        ...setUpShellScript(
          MINECLOUD_BASE_DIR,
          'send_discord_message_to_webhook.sh',
          'server_init_assets/send_discord_message_to_webhook.sh'
        )
      ]),
      setupMineCloudService: new InitConfig([
        ...setUpShellScript(
          MINECLOUD_BASE_DIR,
          'start_service.sh',
          'server_init_assets/start_service.sh'
        ),
        InitFile.fromFileInline(
          '/etc/systemd/system/minecloud.service',
          'server_init_assets/minecloud.service'
        ),
        InitCommand.shellCommand('systemctl enable minecloud.service'),
        InitCommand.shellCommand('systemctl start minecloud.service')
      ]),
      setupBackupScripts: new InitConfig([
        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/backup-folders.txt`,
          'minecloud_configs/advanced_configs/backup-folders.txt'
        ),
        // To convert Windows's EOL to Linux
        InitCommand.shellCommand(`sed -i 's/\r//' backup-folders.txt`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        ...setUpEnviromentVariable('BACKUP_BUCKET_NAME', backupBucketName),
        ...setUpShellScript(
          MINECLOUD_BASE_DIR,
          'server_backup.sh',
          'server_init_assets/server_backup.sh'
        ),
        ...setUpEnviromentVariable(
          'MAX_BACKUP_COUNT',
          MAX_BACKUP_COUNT.toString()
        ),
        ...setUpShellScript(
          MINECLOUD_BASE_DIR,
          'server_manual_backup.sh',
          'server_init_assets/server_manual_backup.sh'
        ),
        ...setUpShellScript(
          MINECLOUD_BASE_DIR,
          'auto_backup_checker.sh',
          'server_init_assets/auto_backup_checker.sh'
        ),
        ...setUpEnviromentVariable(
          'BACKUP_INTERVAL',
          BACKUP_INTERVAL_IN_SECONDS.toString()
        )
      ]),
      setupAutoShutdown: new InitConfig([
        // Setup custom logic for checking how many current connection
        ...setUpShellScript(
          MINECLOUD_BASE_DIR,
          'get_connection_count.sh',
          'minecloud_configs/advanced_configs/get_connection_count.sh'
        ),
        ...setUpShellScript(
          MINECLOUD_BASE_DIR,
          'check_user_conn.sh',
          'server_init_assets/check_user_conn.sh'
        ),

        // Setup crontab scheduler, run every 30 min
        InitCommand.shellCommand(
          `(crontab -l 2>/dev/null; echo "*/30 * * * * ${MINECLOUD_BASE_DIR}/check_user_conn.sh") | crontab -`
        )
      ]),
      noAction: new InitConfig([])
    }
  });
}
