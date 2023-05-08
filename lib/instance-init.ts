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
  DISCORD_CHANNEL_WEB_HOOK,
  MAX_BACKUP_COUNT
} from '../minecloud_configs/MineCloud-Configs';
import { CUSTOM_INIT_CONFIG } from '../minecloud_configs/advanced_configs/custom-instance-init';
import {
  MINECLOUD_BASE_DIR,
  MINECLOUD_SERVER_DIR
} from './const/minecloud-dir';

const MINECLOUD_USER = 'minecloud';
// Not the same name since cfn-init can't figure it out for some reason
const MINECLOUD_GROUP = 'minecloud-group';

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
        'setupAutoShutdown',
        'setupGetLatestBackupScript'
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
        InitFile.fromFileInline(
          `${MINECLOUD_SERVER_DIR}/start_server.sh`,
          'minecloud_configs/server/start_server.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x start_server.sh`, {
          cwd: MINECLOUD_SERVER_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' start_server.sh`, {
          cwd: MINECLOUD_SERVER_DIR
        }),

        InitFile.fromFileInline(
          `${MINECLOUD_SERVER_DIR}/stop_server.sh`,
          'minecloud_configs/server/stop_server.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x stop_server.sh`, {
          cwd: MINECLOUD_SERVER_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' stop_server.sh`, {
          cwd: MINECLOUD_SERVER_DIR
        }),

        InitCommand.shellCommand(
          `chown -R ${MINECLOUD_USER}:${MINECLOUD_GROUP} ${MINECLOUD_BASE_DIR}`
        )
      ]),
      setupDiscordMessaging: new InitConfig([
        InitCommand.shellCommand(
          `echo 'DISCORD_WEB_HOOK=${DISCORD_CHANNEL_WEB_HOOK}' >> /etc/environment`
        ),
        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/send_discord_message_to_webhook.sh`,
          'server_init_assets/send_discord_message_to_webhook.sh'
        ),
        InitCommand.shellCommand(
          `sudo chmod +x send_discord_message_to_webhook.sh`,
          { cwd: MINECLOUD_BASE_DIR }
        ),
        InitCommand.shellCommand(`sed -i 's/\r//' send_discord_message_to_webhook.sh`, 
          { cwd: MINECLOUD_BASE_DIR }
        ),
      ]),
      setupMineCloudService: new InitConfig([
        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/start_service.sh`,
          'server_init_assets/start_service.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x start_service.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' start_service.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitFile.fromFileInline(
          '/etc/systemd/system/minecloud.service',
          'server_init_assets/minecloud.service'
        ),
        InitCommand.shellCommand('systemctl enable minecloud.service'),
        InitCommand.shellCommand('systemctl start minecloud.service')
      ]),
      setupBackupScripts: new InitConfig([
        InitCommand.shellCommand(
          `echo 'BACKUP_BUCKET_NAME=${backupBucketName}' >> /etc/environment`
        ),
        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/server_backup.sh`,
          'server_init_assets/server_backup.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x server_backup.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' server_backup.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(
          `echo 'MAX_BACKUP_COUNT=${MAX_BACKUP_COUNT}' >> /etc/environment`
        ),

        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/server_manual_backup.sh`,
          'server_init_assets/server_manual_backup.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x server_manual_backup.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' server_manual_backup.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),

        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/auto_backup_checker.sh`,
          'server_init_assets/auto_backup_checker.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x auto_backup_checker.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' auto_backup_checker.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(
          `echo 'BACKUP_INTERVAL=${BACKUP_INTERVAL_IN_SECONDS}' >> /etc/environment`
        )
      ]),
      setupAutoShutdown: new InitConfig([
        // Setup custom logic for checking how many current connection
        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/get_connection_count.sh`,
          'minecloud_configs/advanced_configs/get_connection_count.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x get_connection_count.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/check_user_conn.sh`,
          'server_init_assets/check_user_conn.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x check_user_conn.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' check_user_conn.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        // Setup crontab scheduler, run every 30 min
        InitCommand.shellCommand(
          `(crontab -l 2>/dev/null; echo "*/30 * * * * ${MINECLOUD_BASE_DIR}/check_user_conn.sh") | crontab -`
        )
      ]),
      setupGetLatestBackupScript: new InitConfig([
        InitFile.fromFileInline(
          `${MINECLOUD_BASE_DIR}/get_latest_server_backup.sh`,
          'server_init_assets/get_latest_server_backup.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x get_latest_server_backup.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
        InitCommand.shellCommand(`sed -i 's/\r//' get_latest_server_backup.sh`, {
          cwd: MINECLOUD_BASE_DIR
        }),
      ]),
      noAction: new InitConfig([])
    }
  });
}
