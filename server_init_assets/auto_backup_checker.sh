cd /opt/minecraft/

./send_discord_message_to_webhook.sh "Doing auto backup check..."
backUpTimeFilePath=lastBackupTime.txt
if [ ! -f "$backUpTimeFilePath" ]; 
    then
        echo "$backUpTimeFilePath does not exist, creating initial backup"
        ./send_discord_message_to_webhook.sh "Creating initial backup..."
        ./server_backup.sh
        currentTime=$(date +%s)
        echo "$currentTime" > lastBackupTime.txt
    else
        lastBackupTime=`cat lastBackupTime.txt`
        echo "lastBackupTime: $lastBackupTime"

        currentTime=$(date +%s)
        echo "currentTime: $currentTime"

        backUpInterval=${BACKUP_INTERVAL:=10800}
        echo "backUpInterval: $backUpInterval"

        timeSinceLastBackup=$(($currentTime - $lastBackupTime))
        echo "timeSinceLastBackup: $timeSinceLastBackup"

        if (($timeSinceLastBackup > $backUpInterval));
        then
            ./send_discord_message_to_webhook.sh "It has been $(($timeSinceLastBackup/60)) minutes since last auto backup... \nCreating backup OwO... "
            ./server_backup.sh
            currentTime=$(date +%s)
            echo "$currentTime" > lastBackupTime.txt
        else
            ./send_discord_message_to_webhook.sh "Only $(($timeSinceLastBackup/60)) minutes since last auto backup... \n No auto backup needed www..."
        fi;
fi