cd /opt/minecraft/

./send_discord_message_to_webhook.sh "Stopping the server to backup..."
sudo systemctl stop minecraft
./send_discord_message_to_webhook.sh "Start backing up..."

currentTime=$(date +"%Y-%m-%d-%T")

backupArchiveName="backup_${currentTime}.zip"

zip -r ${backupArchiveName} server
aws s3 mv ${backupArchiveName} s3://minecloud-backup-bucket

# Remove older backups
fileList=$(aws s3 ls s3://minecloud-backup-bucket | sort -r)

backUpList=""
maxBackup=${MAX_BACKUP_COUNT:=3}
echo "max backup count: $maxBackup"
i=0
while read fileObj; 
  do
    ((i=i+1))
    echo "$i - $fileObj"; 
    read -a fileObjArr <<< "$fileObj"
    fileName=${fileObjArr[3]}

    if (( i > maxBackup )); 
     then
       echo " => Deleting $fileName"
      aws s3 rm s3://minecloud-backup-bucket/$fileName
     else
       backUpList+=" - ${fileName} \n"
    fi
done <<<"$fileList"

echo "Backup completed"
./send_discord_message_to_webhook.sh "Backup completed, here's all your backups: \n$backUpList"
./send_discord_message_to_webhook.sh "Restarting server..."

sudo systemctl start minecraft