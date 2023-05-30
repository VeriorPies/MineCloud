#!/bin/sh

cd /opt/minecloud/server
echo "Starting Factorio server"
# You can adjust your server start up command here
./factorio/bin/x64/factorio --start-server ./saves/my-save.zip
echo "Factorio server stop"