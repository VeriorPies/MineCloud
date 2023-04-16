import {
  CloudFormationInit,
  InitCommand,
  InitConfig,
  InitFile,
  InitGroup,
  InitPackage,
  InitUser
} from 'aws-cdk-lib/aws-ec2';

import {
  BACKUP_INTERVAL_IN_SECONDS,
  DISCORD_CHANNEL_WEB_HOOK,
  MAX_BACKUP_COUNT
} from '../minecloud_configs/MineCloud-Configs';

const MINECRAFT_USER = 'minecraft';
// Not the same name since cfn-init can't figure it out for some reason
const MINECRAFT_GROUP = 'minecraft-group';
const MINECRAFT_BASE_DIR = '/opt/minecraft';
const MINECRAFT_SERVER_DIR = `${MINECRAFT_BASE_DIR}/server`;

export function getInitConfig(backupBucketName: string) {
  return CloudFormationInit.fromConfigSets({
    configSets: {
      default: [
        'yumPreinstall',
        'setupMinecraftServer',
        'createEula',
        'setupDiscordMessaging',
        'setupMinecraftService',
        'setupBackupScripts',
        'setupAutoShutdown',
        'setupGetLatestBackupScript'
      ]
    },
    configs: {
      yumPreinstall: new InitConfig([
        // Install an Amazon Linux package using yum
        InitPackage.yum('java-17-amazon-corretto-headless')
      ]),
      setupMinecraftServer: new InitConfig([
        InitGroup.fromName(MINECRAFT_GROUP),
        InitUser.fromName(MINECRAFT_USER, {
          groups: [MINECRAFT_GROUP]
        }),

        // Setup directories
        InitCommand.shellCommand(`mkdir -p ${MINECRAFT_SERVER_DIR}`),

        // Setuo server start/stop scripts
        InitFile.fromFileInline(
          `${MINECRAFT_SERVER_DIR}/start_server.sh`,
          'minecloud_configs/server/start_server.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x start_server.sh`, {
          cwd: MINECRAFT_SERVER_DIR
        }),

        InitFile.fromFileInline(
          `${MINECRAFT_SERVER_DIR}/stop_server.sh`,
          'minecloud_configs/server/stop_server.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x stop_server.sh`, {
          cwd: MINECRAFT_SERVER_DIR
        }),

        // Setup server executables
        InitFile.fromAsset(
          `${MINECRAFT_SERVER_DIR}/server.zip`,
          'minecloud_configs/server/server.zip'
        ),
        InitCommand.shellCommand(`sudo unzip server.zip`, {
          cwd: MINECRAFT_SERVER_DIR
        }),
        InitCommand.shellCommand(`sudo rm -f server.zip`, {
          cwd: MINECRAFT_SERVER_DIR
        }),

        InitCommand.shellCommand(
          `chown -R ${MINECRAFT_USER}:${MINECRAFT_GROUP} ${MINECRAFT_BASE_DIR}`
        )
      ]),
      setupDiscordMessaging: new InitConfig([
        InitCommand.shellCommand(
          `echo 'DISCORD_WEB_HOOK=${DISCORD_CHANNEL_WEB_HOOK}' >> /etc/environment`
        ),
        InitFile.fromFileInline(
          `${MINECRAFT_BASE_DIR}/send_discord_message_to_webhook.sh`,
          'server_init_assets/send_discord_message_to_webhook.sh'
        ),
        InitCommand.shellCommand(
          `sudo chmod +x send_discord_message_to_webhook.sh`,
          { cwd: MINECRAFT_BASE_DIR }
        )
      ]),
      setupMinecraftService: new InitConfig([
        InitFile.fromFileInline(
          `${MINECRAFT_BASE_DIR}/start_service.sh`,
          'server_init_assets/start_service.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x start_service.sh`, {
          cwd: MINECRAFT_BASE_DIR
        }),
        InitFile.fromFileInline(
          '/etc/systemd/system/minecraft.service',
          'server_init_assets/minecraft.service'
        ),
        InitCommand.shellCommand('systemctl enable minecraft.service'),
        InitCommand.shellCommand('systemctl start minecraft.service')
      ]),
      setupBackupScripts: new InitConfig([
        InitCommand.shellCommand(
          `echo 'BACKUP_BUCKET_NAME=${backupBucketName}' >> /etc/environment`
        ),
        InitFile.fromFileInline(
          `${MINECRAFT_BASE_DIR}/server_backup.sh`,
          'server_init_assets/server_backup.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x server_backup.sh`, {
          cwd: MINECRAFT_BASE_DIR
        }),
        InitCommand.shellCommand(
          `echo 'MAX_BACKUP_COUNT=${MAX_BACKUP_COUNT}' >> /etc/environment`
        ),

        InitFile.fromFileInline(
          `${MINECRAFT_BASE_DIR}/server_manual_backup.sh`,
          'server_init_assets/server_manual_backup.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x server_manual_backup.sh`, {
          cwd: MINECRAFT_BASE_DIR
        }),

        InitFile.fromFileInline(
          `${MINECRAFT_BASE_DIR}/auto_backup_checker.sh`,
          'server_init_assets/auto_backup_checker.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x auto_backup_checker.sh`, {
          cwd: MINECRAFT_BASE_DIR
        }),
        InitCommand.shellCommand(
          `echo 'BACKUP_INTERVAL=${BACKUP_INTERVAL_IN_SECONDS}' >> /etc/environment`
        )
      ]),
      setupAutoShutdown: new InitConfig([
        InitFile.fromFileInline(
          `${MINECRAFT_BASE_DIR}/check_user_conn.sh`,
          'server_init_assets/check_user_conn.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x check_user_conn.sh`, {
          cwd: MINECRAFT_BASE_DIR
        }),
        // Setup crontab scheduler, run every 30 min
        InitCommand.shellCommand(
          `(crontab -l 2>/dev/null; echo "*/30 * * * * ${MINECRAFT_BASE_DIR}/check_user_conn.sh") | crontab -`
        )
      ]),
      setupGetLatestBackupScript: new InitConfig([
        InitFile.fromFileInline(
          `${MINECRAFT_BASE_DIR}/get_latest_server_backup.sh`,
          'server_init_assets/get_latest_server_backup.sh'
        ),
        InitCommand.shellCommand(`sudo chmod +x get_latest_server_backup.sh`, {
          cwd: MINECRAFT_BASE_DIR
        })
      ])
    }
  });
}
