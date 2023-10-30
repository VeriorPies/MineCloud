cd /opt/minecloud
echo "Server started: $(date)"

MY_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4/)
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id/)
AZ=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone/)

DOMAIN_NAME=$(aws ec2 describe-tags --region ${AZ::-1} --filters "Name=resource-id,Values=${INSTANCE_ID}" --query 'Tags[?Key==`DOMAIN_NAME`].Value' --output text)
if [ ! -z "$DOMAIN_NAME" ]
then
    DNS_NAME="minecloud.$DOMAIN_NAME"

    ZONE=$(aws route53 list-hosted-zones-by-name --dns-name $DOMAIN_NAME --query "HostedZones[].Id" --output text)
    ZONE_ID=${ZONE##*/}

    aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"'$DNS_NAME'","Type":"A","TTL":60,"ResourceRecords":[{"Value":"'$MY_IP'"}]}}]}'
    echo "hostname (ip): $DNAME_NAME ($MY_IP)"
    ./send_discord_message_to_webhook.sh "The server instance is ready >w< !  Here's the hostname/IP address:\n$DNS_NAME ($MY_IP)"
    echo "Discord hostname & public IP sent"
else
    echo "ip: $MY_IP"
    ./send_discord_message_to_webhook.sh "The server instance is ready >w< !  Here's the IP address:\n$MY_IP"
    echo "Discord public IP sent"
fi

#start the Minecloud server
echo "starting server"
cd server
./start_server.sh
echo "server stop"
