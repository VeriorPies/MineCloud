#!/bin/sh
# It looks like occationally this will fail with
# 'Init: Installing breakpad exception handler for appid(steam)/version(xxx)/tid(xxx)' error, which
# seems like a Steam CMD issue (https://github.com/ValveSoftware/steam-for-linux/issues/9321). 
# However, the game server files will still be downloaded even with this error message, thus we decided to always return true as a temporary workaround to avoid deployment failure.
./steamcmd.sh +@sSteamCmdForcePlatformType linux +force_install_dir /opt/minecloud/server/ValheimServer +login anonymous +app_update 896660 -beta none validate +quit || true