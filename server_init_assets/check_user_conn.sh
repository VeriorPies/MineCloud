#!/bin/bash
#Checks for active connections on  port 22 (ssh) and 25565 (minecloud)
#If no connections are found, shut down the server

#Add some delay, so if the server is start right before the crontab sheduled time. The user will still have some time to connect first.
cd /opt/minecloud
sleep 10m

source ./get_connection_count.sh

sshCons=$(netstat -anp | grep :22 | grep ESTABLISHED | wc -l)
mcCons=$(get_current_connection_count)

echo "Active SSH Connections: $sshCons"
echo "Active Server Connections: $mcCons"

if [ $((mcCons)) = 0 ]
then
        echo "Checking for SSH connections before shutting down"
        if [[ $((sshCons)) = 0 ]]
        then
                echo "no ssh connections, closing server instace"
                ./send_discord_message_to_webhook.sh "Hm... there's $mcCons player online now. Shutting down the server instance OwO~"
		sudo systemctl stop minecloud
                ./auto_backup_checker.sh
		./send_discord_message_to_webhook.sh "(Server instance stopped)"
		sudo shutdown
        else
                echo "There are 1 or more active ssh connections, skip termination"
		./send_discord_message_to_webhook.sh "(There's still $sshCons ssh connection...)"
        fi
else
        echo "Somebody is online, do nothing!"
        ./send_discord_message_to_webhook.sh "Hm... there're $mcCons players online now... Come and join Ow<?"
fi