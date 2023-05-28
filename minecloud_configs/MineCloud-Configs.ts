/****** MineCloud Version 1.2.2 ******/

// ---------------- Required -------------------- //
export const AWS_ACCOUNT_ID = '';
export const AWS_REGION = '';

export const DISCORD_APP_ID = '';
export const DISCORD_PUBLIC_KEY = '';
export const DISCORD_BOT_TOKEN = '';
export const DISCORD_CHANNEL_WEB_HOOK = '';

// ------------- CloudFormation ------------- //
export const STACK_NAME = 'Minecraft'; 

// -------------- Server Executable ------------- //
// If set to true, /minecloud_configs/server/server.zip will be deployed
export const DEPLOY_LOCAL_SERVER_EXECUTABLE = false; 

// ----------------EC2 Machine Settings-------------------- //
// EC2 max price per hours, in dollars
export const MAX_PRICE = 0.1; 
// EC2 instance type, refer to https://aws.amazon.com/ec2/instance-types/ for more info
export const EC2_INSTANCE_TYPE = 't2.large';
// Disk size, in GB
export const EC2_VOLUME = 16;
// Init time out, in minutes
export const EC2_INIT_TIMEOUT = 15;

// --------------- Backup Settings------------------ //
// At most how many backups
export const MAX_BACKUP_COUNT = 3;
export const BACKUP_INTERVAL_IN_SECONDS = 10800;
