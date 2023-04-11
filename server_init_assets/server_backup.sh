cd /opt/minecraft/

currentTime=$(date +"%Y-%m-%d-%T")

backupArchiveName="backup_${currentTime}.zip"

zip -r ${backupArchiveName} server
aws s3 mv ${backupArchiveName} s3://minecloud-backup-bucket

# Remove older backups
fileList=$(aws s3 ls s3://minecloud-backup-bucket | sort -r)

maxBackup=${MAX_BACKUP_COUNT:=3}
echo "max backup count: $maxBackup"
i=0
while read fileObj; 
  do
    ((i=i+1))
    echo "$i - $fileObj"; 
    if (( i > maxBackup )); then
     read -a fileObjArr <<< "$fileObj"
     fileName=${fileObjArr[3]}
     echo " => Deleting $fileName"
     aws s3 rm s3://minecloud-backup-bucket/$fileName
    fi
done <<<"$fileList"
echo "Backup completed"