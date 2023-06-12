import {
    InitCommand,
    InitConfig,
    InitFile,
    InitPackage
} from 'aws-cdk-lib/aws-ec2';
import { MINECLOUD_SERVER_DIR } from '../../lib/const/minecloud-dir';
const STEAMCMD_DOWNLOAD_URL = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz';
const STEAM_CMD_FILE_NAME = 'steamcmd_linux.tar.gz';

// https://developer.valvesoftware.com/wiki/SteamCMD#Manually
export const STEAM_CMD_INIT = [
    InitPackage.yum('glibc.i686'),
    InitPackage.yum('libstdc++.i686'),
    InitFile.fromUrl(
        `${MINECLOUD_SERVER_DIR}/${STEAM_CMD_FILE_NAME}`,
        STEAMCMD_DOWNLOAD_URL
    ),
    InitCommand.shellCommand(`tar zxvf ${STEAM_CMD_FILE_NAME}`,{
        cwd: MINECLOUD_SERVER_DIR
    }),
  ];