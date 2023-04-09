#!/bin/bash
#Checks for active connections on  port 22 (ssh) and 25565 (minecraft)
#If no connections are found, shut down the server

#Add some delay, so if the server is start right before the crontab sheduled time. The user will still have some time to connect first.
cd /opt/minecraft
sleep 10m

sshCons=$(netstat -anp | grep :22 | grep ESTABLISHED | wc -l)
mcCons=$(netstat -anp | grep :25565 | grep ESTABLISHED | wc -l)
echo "Active SSH Connections: $sshCons"
echo "Active Minecraft Connections: $mcCons"

./send_discord_message_to_webhook.sh "Hm... there're still $mcCons people here...QwQ \n(When can I go home...?)"

if [ $((mcCons)) = 0 ]
then
        echo "Checking for SSH connections before shutting down"
        if [[ $((sshCons)) = 0 ]]
        then
                echo "no ssh connections, closing server instace"
                ./send_discord_message_to_webhook.sh "Nobody here~ Shutting down the server OwO~"
		sudo systemctl stop minecraft
		# /home/ubuntu/mc/backup.sh # Not for now
		# /home/ubuntu/mc/discord.sh/discord.sh --text "Done~ Shutting down~~" # Not for now
		sudo shutdown
        else
                echo "There are 1 or more active ssh connections, skip termination"
		./send_discord_message_to_webhook.sh "(There's still $sshCons ssh connection...)"
        fi
else
        echo "Somebody is playing minecraft, do nothing!"
fi