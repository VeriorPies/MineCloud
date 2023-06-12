// ------------- CloudFormation ------------- //
export const STACK_NAME = 'Valheim';

// -------------- Server Executable ------------- //
// If set to true, /minecloud_configs/server/server.zip will be deployed
export const DEPLOY_LOCAL_SERVER_EXECUTABLE = false;

// ----------------EC2 Machine Settings-------------------- //
// EC2 max price per hours, in dollars
export const MAX_PRICE = 0.2;
// EC2 instance type, refer to https://aws.amazon.com/ec2/instance-types/ for more info
export const EC2_INSTANCE_TYPE = 't2.xlarge';
// Disk size, in GB
export const EC2_VOLUME = 8;
// Init time out, in minutes
export const EC2_INIT_TIMEOUT = 20;

// --------------- Backup Settings------------------ //
// At most how many backups
export const MAX_BACKUP_COUNT = 3;
export const BACKUP_INTERVAL_IN_SECONDS = 10800;
