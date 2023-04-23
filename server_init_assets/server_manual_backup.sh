cd /opt/minecloud/

./send_discord_message_to_webhook.sh "Stopping the server to backup..."
sudo systemctl stop minecloud

./server_backup.sh

./send_discord_message_to_webhook.sh "Restarting server..."
sudo systemctl start minecloud