#!/bin/bash

# Test LocalStack Infrastructure
# Verifies that S3, SQS, and Lambda are working correctly

set -e

echo "🧪 Testing LocalStack infrastructure..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get Terraform outputs
cd infrastructure/environments/local
BUCKET_NAME=$(terraform output -raw s3_jobs_bucket_name)
QUEUE_URL=$(terraform output -raw sqs_jobs_queue_url)
LAMBDA_NAME=$(terraform output -raw lambda_function_name)

echo "Configuration:"
echo "  Bucket: $BUCKET_NAME"
echo "  Queue: $QUEUE_URL"
echo "  Lambda: $LAMBDA_NAME"
echo ""

# Test 1: S3 Bucket
echo "1️⃣  Testing S3 bucket..."
echo "test data" > /tmp/test-file.txt

aws --endpoint-url=http://localhost:4566 \
  s3 cp /tmp/test-file.txt s3://$BUCKET_NAME/test/test-file.txt \
  --region eu-south-2 > /dev/null 2>&1

if aws --endpoint-url=http://localhost:4566 \
  s3 ls s3://$BUCKET_NAME/test/ \
  --region eu-south-2 | grep -q "test-file.txt"; then
  echo -e "   ${GREEN}✅ S3 upload/list works${NC}"
else
  echo -e "   ${RED}❌ S3 test failed${NC}"
  exit 1
fi

rm /tmp/test-file.txt

# Test 2: SQS Queue
echo "2️⃣  Testing SQS queue..."
MESSAGE_ID=$(aws --endpoint-url=http://localhost:4566 \
  sqs send-message \
  --queue-url $QUEUE_URL \
  --message-body '{"taskId":"test-123","jobType":"example","payload":{"test":true}}' \
  --region eu-south-2 \
  --output text \
  --query 'MessageId')

if [ ! -z "$MESSAGE_ID" ]; then
  echo -e "   ${GREEN}✅ SQS send message works (Message ID: $MESSAGE_ID)${NC}"
else
  echo -e "   ${RED}❌ SQS test failed${NC}"
  exit 1
fi

# Test 3: Lambda Function
echo "3️⃣  Testing Lambda function..."
cat > /tmp/lambda-event.json <<EOF
{
  "Records": [{
    "messageId": "test-message-1",
    "body": "{\"taskId\":\"test-456\",\"jobType\":\"example\",\"payload\":{\"test\":true}}"
  }]
}
EOF

LAMBDA_RESULT=$(aws --endpoint-url=http://localhost:4566 \
  lambda invoke \
  --function-name $LAMBDA_NAME \
  --payload file:///tmp/lambda-event.json \
  --region eu-south-2 \
  /tmp/lambda-response.json 2>&1)

if [ -f "/tmp/lambda-response.json" ]; then
  echo -e "   ${GREEN}✅ Lambda invocation works${NC}"
  echo "   Response: $(cat /tmp/lambda-response.json)"
else
  echo -e "   ${RED}❌ Lambda test failed${NC}"
  echo "$LAMBDA_RESULT"
  exit 1
fi

rm /tmp/lambda-event.json /tmp/lambda-response.json

# Test 4: Check CloudWatch Logs (if available)
echo "4️⃣  Checking Lambda logs..."
LOGS=$(aws --endpoint-url=http://localhost:4566 \
  logs describe-log-groups \
  --region eu-south-2 2>&1 || echo "")

if echo "$LOGS" | grep -q "/aws/lambda"; then
  echo -e "   ${GREEN}✅ CloudWatch logs available${NC}"
else
  echo "   ⚠️  CloudWatch logs not available (expected in LocalStack)"
fi

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "🎯 LocalStack is ready for development"
echo ""
