#!/bin/sh

echo "Starting Minecraft server"
# You can adjust your server start up command here
/usr/bin/env java -Xmx6144M -Xms1024M -jar server.jar nogui
echo "Minecraft server stop"