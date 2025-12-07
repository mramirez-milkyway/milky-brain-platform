#!/bin/bash

# Destroy LocalStack Infrastructure
# Removes all resources created by localstack-init.sh

set -e

ENDPOINT="http://localhost:4566"
REGION="eu-south-2"
BUCKET_NAME="local-milky-way-admin-panel-jobs"
QUEUE_NAME="local-milky-way-admin-panel-jobs"
DLQ_NAME="local-milky-way-admin-panel-jobs-dlq"
LAMBDA_NAME="local-milky-way-admin-panel-job-processor"

echo "🗑️  Destroying LocalStack infrastructure..."
echo ""

# Function to run AWS CLI with LocalStack endpoint
awslocal() {
  aws --endpoint-url=$ENDPOINT --region=$REGION "$@"
}

# 1. Delete Event Source Mappings
echo "1️⃣  Deleting event source mappings..."
MAPPINGS=$(awslocal lambda list-event-source-mappings \
  --function-name $LAMBDA_NAME \
  --output text \
  --query 'EventSourceMappings[*].UUID' 2>/dev/null || echo "")

if [ ! -z "$MAPPINGS" ]; then
  for UUID in $MAPPINGS; do
    awslocal lambda delete-event-source-mapping --uuid $UUID > /dev/null 2>&1
    echo "   ✅ Deleted mapping: $UUID"
  done
else
  echo "   ℹ️  No mappings found"
fi
echo ""

# 2. Delete Lambda Function
echo "2️⃣  Deleting Lambda function..."
if awslocal lambda delete-function --function-name $LAMBDA_NAME > /dev/null 2>&1; then
  echo "   ✅ Lambda function deleted"
else
  echo "   ℹ️  Lambda function not found"
fi
echo ""

# 3. Delete SQS Queues
echo "3️⃣  Deleting SQS queues..."

QUEUE_URL=$(awslocal sqs get-queue-url --queue-name $QUEUE_NAME --output text --query 'QueueUrl' 2>/dev/null || echo "")
if [ ! -z "$QUEUE_URL" ]; then
  awslocal sqs delete-queue --queue-url $QUEUE_URL
  echo "   ✅ Deleted queue: $QUEUE_NAME"
else
  echo "   ℹ️  Queue not found: $QUEUE_NAME"
fi

DLQ_URL=$(awslocal sqs get-queue-url --queue-name $DLQ_NAME --output text --query 'QueueUrl' 2>/dev/null || echo "")
if [ ! -z "$DLQ_URL" ]; then
  awslocal sqs delete-queue --queue-url $DLQ_URL
  echo "   ✅ Deleted DLQ: $DLQ_NAME"
else
  echo "   ℹ️  DLQ not found: $DLQ_NAME"
fi
echo ""

# 4. Delete S3 Bucket (and all objects)
echo "4️⃣  Deleting S3 bucket..."
if awslocal s3 ls s3://$BUCKET_NAME > /dev/null 2>&1; then
  awslocal s3 rb s3://$BUCKET_NAME --force
  echo "   ✅ Bucket deleted: $BUCKET_NAME"
else
  echo "   ℹ️  Bucket not found: $BUCKET_NAME"
fi
echo ""

# 5. Delete IAM Role
echo "5️⃣  Deleting IAM role..."
if awslocal iam delete-role --role-name localstack-lambda-job-processor > /dev/null 2>&1; then
  echo "   ✅ IAM role deleted"
else
  echo "   ℹ️  IAM role not found"
fi
echo ""

echo "✅ LocalStack infrastructure destroyed!"
echo ""
