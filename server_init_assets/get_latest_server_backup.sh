cd /opt/minecraft/

./send_discord_message_to_webhook.sh "Grabbing the latest backup for you..."

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
    presignURL=$(aws s3 presign s3://minecloud-backup-bucket/$fileName --expires-in 7200)
    ./send_discord_message_to_webhook.sh "Here's the download link for $fileName:\n $presignURL"
    break
done <<<"$fileList"