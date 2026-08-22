variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "ami_id" {
  description = "AMI ID for EC2 instance"
  type        = string
  default     = "ami-0eb3161272dc9c6eb"
}

variable "instance_name" {
  description = "Name tag for EC2 instance"
  type        = string
  default     = "Relic"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}


variable "aws_key_pair" {
  description = "Name of the AWS key pair"
  type        = string
  default     = "relic-key"
}

variable "volume_size" {
  type    = number
  default = 8
}

variable "deployment_type" {
  type    = string
  default = "Prod"
}
variable "security_group_name" {
  description = "Name of the security group"
  type        = string
  default     = "relic-sg"
}

variable "subnet_id" {
  description = "Subnet ID for the EC2 instance"
  type        = string
  default     = null
}

