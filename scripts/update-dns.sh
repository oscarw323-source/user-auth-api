#!/bin/bash

DUCK_TOKEN=$(grep DUCK_TOKEN "$(dirname "$0")/../.env" | cut -d '=' -f2)
DUCK_DOMAIN="mint-chat"

echo "🔍 Получаем новый IP из ECS..."

TASK_ARN=$(aws ecs list-tasks \
--cluster user-auth-api-cluster \
--region eu-north-1 \
--query "taskArns[0]" \
--output text)

ENI=$(aws ecs describe-tasks \
--cluster user-auth-api-cluster \
--tasks $TASK_ARN \
--query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" \
--output text \
--region eu-north-1)

PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids $ENI \
  --query "NetworkInterfaces[0].Association.PublicIp" \
  --output text \
  --region eu-north-1)

echo "📡 Новый IP: $PUBLIC_IP"


RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=$DUCK_DOMAIN&token=$DUCK_TOKEN&ip=$PUBLIC_IP")

if [ "$RESPONSE" = "OK" ]; then
  echo "✅ DNS обновлён: mint-chat.duckdns.org → $PUBLIC_IP"
else
  echo "❌ Ошибка обновления DNS: $RESPONSE"
fi