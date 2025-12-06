variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "delay_seconds" {
  description = "The time in seconds that the delivery of messages is delayed"
  type        = number
  default     = 0
}

variable "max_message_size" {
  description = "The limit of how many bytes a message can contain"
  type        = number
  default     = 262144 # 256 KB
}

variable "message_retention_seconds" {
  description = "The number of seconds messages are retained"
  type        = number
  default     = 345600 # 4 days
}

variable "receive_wait_time_seconds" {
  description = "The time for which a ReceiveMessage call will wait for a message to arrive"
  type        = number
  default     = 20 # Long polling
}

variable "visibility_timeout_seconds" {
  description = "The visibility timeout for the queue"
  type        = number
  default     = 900 # 15 minutes (match Lambda timeout)
}

variable "max_receive_count" {
  description = "The maximum number of times a message can be received before being sent to DLQ"
  type        = number
  default     = 3
}

variable "dlq_message_retention_seconds" {
  description = "The number of seconds messages are retained in DLQ"
  type        = number
  default     = 1209600 # 14 days
}

variable "enable_dlq_alarm" {
  description = "Enable CloudWatch alarm for DLQ messages"
  type        = bool
  default     = true
}

variable "enable_queue_depth_alarm" {
  description = "Enable CloudWatch alarm for queue depth"
  type        = bool
  default     = true
}

variable "enable_message_age_alarm" {
  description = "Enable CloudWatch alarm for message age"
  type        = bool
  default     = true
}

variable "queue_depth_threshold" {
  description = "Threshold for queue depth alarm"
  type        = number
  default     = 1000
}

variable "message_age_threshold" {
  description = "Threshold for message age alarm (in seconds)"
  type        = number
  default     = 3600 # 1 hour
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}
