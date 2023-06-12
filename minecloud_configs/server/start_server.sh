#!/bin/sh

echo "Starting Valheim"
# Start the server as ec2-user
cd /home/ec2-user/valheim
runuser -u ec2-user ./start_valheim_server.sh
echo "Valheim server stop"