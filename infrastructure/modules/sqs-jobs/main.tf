# SQS Queue Module for Job Processing
# Creates main queue and Dead Letter Queue for failed messages

# Dead Letter Queue for failed messages
resource "aws_sqs_queue" "dlq" {
  name                       = "${var.environment}-${var.project_name}-jobs-dlq"
  message_retention_seconds  = var.dlq_message_retention_seconds
  receive_wait_time_seconds  = 0
  visibility_timeout_seconds = 30

  tags = {
    Name        = "${var.environment}-${var.project_name}-jobs-dlq"
    Environment = var.environment
    Purpose     = "Job processing DLQ"
  }
}

# Main job queue
resource "aws_sqs_queue" "jobs" {
  name                       = "${var.environment}-${var.project_name}-jobs"
  delay_seconds              = var.delay_seconds
  max_message_size           = var.max_message_size
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = var.receive_wait_time_seconds
  visibility_timeout_seconds = var.visibility_timeout_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = {
    Name        = "${var.environment}-${var.project_name}-jobs"
    Environment = var.environment
    Purpose     = "Job processing queue"
  }
}

# CloudWatch alarm for DLQ messages
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  count               = var.enable_dlq_alarm ? 1 : 0
  alarm_name          = "${var.environment}-${var.project_name}-jobs-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when messages appear in DLQ"
  alarm_actions       = var.alarm_actions

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-jobs-dlq-alarm"
    Environment = var.environment
  }
}

# CloudWatch alarm for queue depth
resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  count               = var.enable_queue_depth_alarm ? 1 : 0
  alarm_name          = "${var.environment}-${var.project_name}-jobs-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "Alert when queue depth is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    QueueName = aws_sqs_queue.jobs.name
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-jobs-depth-alarm"
    Environment = var.environment
  }
}

# CloudWatch alarm for message age
resource "aws_cloudwatch_metric_alarm" "message_age" {
  count               = var.enable_message_age_alarm ? 1 : 0
  alarm_name          = "${var.environment}-${var.project_name}-jobs-message-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = var.message_age_threshold
  alarm_description   = "Alert when oldest message is too old"
  alarm_actions       = var.alarm_actions

  dimensions = {
    QueueName = aws_sqs_queue.jobs.name
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-jobs-age-alarm"
    Environment = var.environment
  }
}
