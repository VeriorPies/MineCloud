#!/bin/sh

/usr/bin/screen -S mc_server -X stuff 'say Server shutting down (closing by the system service)^M'
/usr/bin/screen -S mc_server -X stuff 'save-all^M'
/bin/sleep 10
/usr/bin/screen -S mc_server -X stuff 'stop^M'
/opt/minecloud/send_discord_message_to_webhook.sh "Shutting Minecraft server down..."
/bin/sleep 10
/opt/minecloud/send_discord_message_to_webhook.sh "(Minecraft server shut down)"