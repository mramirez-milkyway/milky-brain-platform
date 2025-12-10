#!/bin/bash

# Initialize LocalStack Infrastructure
# Creates S3 bucket, SQS queues, and Lambda function using AWS CLI

set -e

ENDPOINT="http://localhost:4566"
REGION="eu-south-2"
BUCKET_NAME="local-milky-way-admin-panel-jobs"
QUEUE_NAME="local-milky-way-admin-panel-jobs"
DLQ_NAME="local-milky-way-admin-panel-jobs-dlq"
LAMBDA_NAME="local-milky-way-admin-panel-job-processor"

echo "🚀 Initializing LocalStack infrastructure..."
echo ""

# Check LocalStack is running
if ! curl -s $ENDPOINT/_localstack/health > /dev/null 2>&1; then
  echo "❌ LocalStack is not running!"
  echo "   Start it with: make localstack-up"
  exit 1
fi

echo "✅ LocalStack is running"
echo ""

# Function to run AWS CLI with LocalStack endpoint
awslocal() {
  aws --endpoint-url=$ENDPOINT --region=$REGION "$@"
}

# 1. Create S3 Bucket
echo "1️⃣  Creating S3 bucket: $BUCKET_NAME"
if awslocal s3 mb s3://$BUCKET_NAME 2>/dev/null; then
  echo "   ✅ Bucket created"
else
  echo "   ℹ️  Bucket already exists"
fi

# Enable versioning
awslocal s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

echo ""

# 2. Create Dead Letter Queue
echo "2️⃣  Creating Dead Letter Queue: $DLQ_NAME"
DLQ_URL=$(awslocal sqs create-queue \
  --queue-name $DLQ_NAME \
  --output text \
  --query 'QueueUrl' 2>/dev/null || \
  awslocal sqs get-queue-url \
  --queue-name $DLQ_NAME \
  --output text \
  --query 'QueueUrl')

echo "   ✅ DLQ URL: $DLQ_URL"

# Get DLQ ARN
DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url $DLQ_URL \
  --attribute-names QueueArn \
  --output text \
  --query 'Attributes.QueueArn')

echo "   ✅ DLQ ARN: $DLQ_ARN"
echo ""

# 3. Create Main Queue with DLQ
echo "3️⃣  Creating SQS queue: $QUEUE_NAME"

# Create redrive policy (properly escaped for JSON)
REDRIVE_POLICY="{\\\"deadLetterTargetArn\\\":\\\"$DLQ_ARN\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}"

# Try to create queue with attributes
if awslocal sqs create-queue \
  --queue-name $QUEUE_NAME \
  --attributes VisibilityTimeout=900,MessageRetentionPeriod=345600,ReceiveMessageWaitTimeSeconds=20,RedrivePolicy="$REDRIVE_POLICY" \
  > /dev/null 2>&1; then
  echo "   ✅ Queue created"
else
  # Queue might already exist, try to get it
  echo "   ℹ️  Queue creation returned error, checking if it exists..."
fi

# Get Queue URL (will fail if queue doesn't exist)
QUEUE_URL=$(awslocal sqs get-queue-url \
  --queue-name $QUEUE_NAME \
  --output text \
  --query 'QueueUrl' 2>/dev/null || echo "")

if [ -z "$QUEUE_URL" ]; then
  echo "   ❌ Failed to create or retrieve queue"
  echo "   Trying to create queue without RedrivePolicy first..."

  # Create queue without redrive policy
  QUEUE_URL=$(awslocal sqs create-queue \
    --queue-name $QUEUE_NAME \
    --attributes VisibilityTimeout=900,MessageRetentionPeriod=345600,ReceiveMessageWaitTimeSeconds=20 \
    --output text \
    --query 'QueueUrl')

  # Then set the redrive policy separately
  awslocal sqs set-queue-attributes \
    --queue-url "$QUEUE_URL" \
    --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"$DLQ_ARN\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"

  echo "   ✅ Queue created and RedrivePolicy set"
else
  echo "   ✅ Queue URL: $QUEUE_URL"
fi

# Get Queue ARN
QUEUE_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url $QUEUE_URL \
  --attribute-names QueueArn \
  --output text \
  --query 'Attributes.QueueArn')

echo "   ✅ Queue ARN: $QUEUE_ARN"
echo ""

# 4. Create IAM Role for Lambda
echo "4️⃣  Creating IAM role for Lambda"

ASSUME_ROLE_POLICY=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
)

awslocal iam create-role \
  --role-name localstack-lambda-job-processor \
  --assume-role-policy-document "$ASSUME_ROLE_POLICY" \
  > /dev/null 2>&1 || echo "   ℹ️  Role already exists"

ROLE_ARN=$(awslocal iam get-role \
  --role-name localstack-lambda-job-processor \
  --output text \
  --query 'Role.Arn')

echo "   ✅ Role ARN: $ROLE_ARN"
echo ""

# 5. Build Lambda package
echo "5️⃣  Building Lambda package..."
cd lambdas/job-processor

if [ ! -f "package.json" ]; then
  echo "   ❌ Lambda package.json not found!"
  exit 1
fi

# Install dependencies and build
npm install --silent
npm run build

if [ ! -f "lambda.zip" ]; then
  echo "   ❌ Lambda package failed to build!"
  exit 1
fi

echo "   ✅ Lambda package built ($(du -h lambda.zip | cut -f1))"
cd ../..
echo ""

# 6. Create/Update Lambda Function
echo "6️⃣  Creating Lambda function: $LAMBDA_NAME"

# Database URL for LocalStack Lambda (using host.docker.internal)
DATABASE_URL="postgresql://admin:admin123@host.docker.internal:5432/admin_panel"

# Upload Lambda zip to S3 first (required for packages > 50MB)
LAMBDA_S3_KEY="lambda-code/job-processor.zip"
echo "   ℹ️  Uploading Lambda package to S3..."
awslocal s3 cp lambdas/job-processor/lambda.zip s3://$BUCKET_NAME/$LAMBDA_S3_KEY > /dev/null
echo "   ✅ Lambda package uploaded to S3"

# Check if function actually exists
FUNCTION_EXISTS=$(awslocal lambda get-function \
  --function-name $LAMBDA_NAME \
  --output text \
  --query 'Configuration.FunctionName' 2>/dev/null || echo "")

if [ -z "$FUNCTION_EXISTS" ]; then
  # Function doesn't exist, create it
  echo "   ℹ️  Creating new function..."
  awslocal lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs20.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --timeout 900 \
    --memory-size 512 \
    --code S3Bucket=$BUCKET_NAME,S3Key=$LAMBDA_S3_KEY \
    --environment "Variables={NODE_ENV=local,DATABASE_URL=$DATABASE_URL,S3_JOBS_BUCKET_NAME=$BUCKET_NAME,SQS_JOBS_QUEUE_URL=$QUEUE_URL,AWS_REGION=$REGION,LOG_LEVEL=debug}" \
    > /dev/null
  echo "   ✅ Lambda function created"
else
  # Function exists, update it
  echo "   ℹ️  Function exists, updating code..."
  awslocal lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --s3-bucket $BUCKET_NAME \
    --s3-key $LAMBDA_S3_KEY \
    > /dev/null

  # Wait for code update to complete
  echo "   ℹ️  Waiting for code update to complete..."
  sleep 3

  # Wait until function is ready
  for i in {1..10}; do
    STATE=$(awslocal lambda get-function \
      --function-name $LAMBDA_NAME \
      --output text \
      --query 'Configuration.State' 2>/dev/null || echo "Active")

    if [ "$STATE" = "Active" ]; then
      break
    fi

    echo "   ℹ️  Function state: $STATE, waiting..."
    sleep 2
  done

  echo "   ℹ️  Updating configuration..."
  awslocal lambda update-function-configuration \
    --function-name $LAMBDA_NAME \
    --timeout 900 \
    --memory-size 512 \
    --environment "Variables={NODE_ENV=local,DATABASE_URL=$DATABASE_URL,S3_JOBS_BUCKET_NAME=$BUCKET_NAME,SQS_JOBS_QUEUE_URL=$QUEUE_URL,AWS_REGION=$REGION,LOG_LEVEL=debug}" \
    > /dev/null

  echo "   ✅ Lambda function updated"
fi

LAMBDA_ARN=$(awslocal lambda get-function \
  --function-name $LAMBDA_NAME \
  --output text \
  --query 'Configuration.FunctionArn')

echo "   ✅ Lambda ARN: $LAMBDA_ARN"
echo ""

# 7. Create Event Source Mapping (SQS -> Lambda)
echo "7️⃣  Creating event source mapping (SQS → Lambda)"

# Check if mapping already exists
# Note: AWS CLI returns "None" as text when no mappings exist, not empty string
EXISTING_MAPPING=$(awslocal lambda list-event-source-mappings \
  --function-name $LAMBDA_NAME \
  --output text \
  --query 'EventSourceMappings[0].UUID' 2>/dev/null || echo "")

if [ -z "$EXISTING_MAPPING" ] || [ "$EXISTING_MAPPING" = "None" ]; then
  awslocal lambda create-event-source-mapping \
    --function-name $LAMBDA_NAME \
    --event-source-arn $QUEUE_ARN \
    --batch-size 10 \
    --enabled \
    > /dev/null
  echo "   ✅ Event source mapping created"
else
  echo "   ℹ️  Event source mapping already exists (UUID: $EXISTING_MAPPING)"
fi

echo ""
echo "🎉 LocalStack infrastructure is ready!"
echo ""
echo "📋 Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "S3 Bucket:        $BUCKET_NAME"
echo "SQS Queue URL:    $QUEUE_URL"
echo "SQS DLQ URL:      $DLQ_URL"
echo "Lambda Function:  $LAMBDA_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next steps:"
echo "  1. Start the API: docker-compose up -d api"
echo "  2. Test infrastructure: ./scripts/localstack-test.sh"
echo "  3. Create a job: curl -X POST http://localhost:4000/api/jobs ..."
echo ""
