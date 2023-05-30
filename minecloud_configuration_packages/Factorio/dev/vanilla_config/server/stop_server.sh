#!/bin/sh

/usr/bin/screen -S mc_server -X stuff 'Server shutting down (closing by the system service)^M'
/bin/sleep 10
/usr/bin/screen -S mc_server -X stuff '/quit^M'
/opt/minecloud/send_discord_message_to_webhook.sh "Shutting Factorio server down..."
/bin/sleep 10
/opt/minecloud/send_discord_message_to_webhook.sh "(Factorio server shut down)"