cd /opt/minecraft
echo "Server started: $(date)"
public_ip=$(dig +short myip.opendns.com @resolver1.opendns.com)
echo "new ip: $public_ip"
./send_discord_message_to_webhook.sh "The server instance is ready >w< !  Here's the IP address:\n$public_ip"
echo "Discord public IP sent"

#start the Minecraft server
echo "starting server"
cd server
./start_server.sh
echo "server stop"