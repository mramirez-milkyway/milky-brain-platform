#!/bin/bash

# Test LocalStack Infrastructure
# Verifies that S3, SQS, and Lambda are working correctly

set -e

ENDPOINT="http://localhost:4566"
REGION="eu-south-2"
BUCKET_NAME="local-milky-way-admin-panel-jobs"
QUEUE_NAME="local-milky-way-admin-panel-jobs"
DLQ_NAME="local-milky-way-admin-panel-jobs-dlq"
LAMBDA_NAME="local-milky-way-admin-panel-job-processor"

echo "🧪 Testing LocalStack infrastructure..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run AWS CLI with LocalStack endpoint
awslocal() {
  aws --endpoint-url=$ENDPOINT --region=$REGION "$@"
}

# Get resource URLs
QUEUE_URL=$(awslocal sqs get-queue-url --queue-name $QUEUE_NAME --output text --query 'QueueUrl' 2>/dev/null || echo "")
DLQ_URL=$(awslocal sqs get-queue-url --queue-name $DLQ_NAME --output text --query 'QueueUrl' 2>/dev/null || echo "")

echo "Configuration:"
echo "  Bucket: $BUCKET_NAME"
echo "  Queue: $QUEUE_URL"
echo "  DLQ: $DLQ_URL"
echo "  Lambda: $LAMBDA_NAME"
echo ""

# Test 1: S3 Bucket
echo "1️⃣  Testing S3 bucket..."
echo "test data" > /tmp/test-file.txt

if awslocal s3 cp /tmp/test-file.txt s3://$BUCKET_NAME/test/test-file.txt > /dev/null 2>&1; then
  if awslocal s3 ls s3://$BUCKET_NAME/test/ | grep -q "test-file.txt"; then
    echo -e "   ${GREEN}✅ S3 upload/list works${NC}"
  else
    echo -e "   ${RED}❌ S3 file not found after upload${NC}"
    exit 1
  fi
else
  echo -e "   ${RED}❌ S3 upload failed${NC}"
  exit 1
fi

rm /tmp/test-file.txt

# Test 2: SQS Queue
echo "2️⃣  Testing SQS queue..."
MESSAGE_ID=$(awslocal sqs send-message \
  --queue-url $QUEUE_URL \
  --message-body '{"taskId":"test-123","jobType":"example","payload":{"test":true}}' \
  --output text \
  --query 'MessageId' 2>&1)

if [ ! -z "$MESSAGE_ID" ] && [[ ! "$MESSAGE_ID" =~ "error" ]]; then
  echo -e "   ${GREEN}✅ SQS send message works (Message ID: $MESSAGE_ID)${NC}"
else
  echo -e "   ${RED}❌ SQS test failed: $MESSAGE_ID${NC}"
  exit 1
fi

# Test 3: Lambda Function
echo "3️⃣  Testing Lambda function..."

LAMBDA_RESULT=$(awslocal lambda invoke \
  --function-name $LAMBDA_NAME \
  --cli-binary-format raw-in-base64-out \
  --payload '{"Records":[{"messageId":"test-1","body":"{\"taskId\":\"test-456\",\"jobType\":\"example\",\"payload\":{\"test\":true}}"}]}' \
  /tmp/lambda-response.json 2>&1)

if [ -f "/tmp/lambda-response.json" ]; then
  RESPONSE=$(cat /tmp/lambda-response.json)
  STATUS_CODE=$(echo "$LAMBDA_RESULT" | jq -r '.StatusCode' 2>/dev/null || echo "200")

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Lambda invocation works${NC}"
    echo "   Response: $RESPONSE"
  else
    echo -e "   ${RED}❌ Lambda returned non-200 status${NC}"
    echo "$LAMBDA_RESULT"
    exit 1
  fi
else
  echo -e "   ${RED}❌ Lambda test failed${NC}"
  echo "$LAMBDA_RESULT"
  exit 1
fi

rm /tmp/lambda-response.json 2>/dev/null || true

# Test 4: Check CloudWatch Logs (if available)
echo "4️⃣  Checking Lambda logs..."
LOGS=$(awslocal logs describe-log-groups 2>&1 || echo "")

if echo "$LOGS" | grep -q "/aws/lambda"; then
  echo -e "   ${GREEN}✅ CloudWatch logs available${NC}"
else
  echo "   ⚠️  CloudWatch logs not available (expected in LocalStack free)"
fi

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "🎯 LocalStack is ready for development"
echo ""
echo "Next steps:"
echo "  1. Start API: docker-compose up -d api"
echo "  2. Create a job: curl -X POST http://localhost:4000/api/jobs ..."
echo "  3. View logs: make localstack-logs"
echo ""
