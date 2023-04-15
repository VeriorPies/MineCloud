cd /opt/minecraft
echo "Server started: $(date)"
public_ip=$(dig +short myip.opendns.com @resolver1.opendns.com)
echo "new ip: $public_ip"
./send_discord_message_to_webhook.sh "The server just spinned up!! Here's the IP 0w0 :\n$public_ip"
echo "Discord public IP sent"

#start the Minecraft server
echo "starting server"
cd server
./start_server.sh
echo "server stop"