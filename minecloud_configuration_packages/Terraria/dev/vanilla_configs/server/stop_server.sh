#!/bin/sh

# Send commands to the server
/usr/bin/screen -S mc_server -X stuff 'say Server shutting down (closing by the system service)^M'
/usr/bin/screen -S mc_server -X stuff 'exit^M'
# Send message to Discord server
/opt/minecloud/send_discord_message_to_webhook.sh "Shutting Terraria server down..."
/bin/sleep 10
/opt/minecloud/send_discord_message_to_webhook.sh "(Terraria server shut down)"