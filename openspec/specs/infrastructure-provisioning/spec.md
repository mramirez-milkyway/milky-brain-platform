# infrastructure-provisioning Specification

## Purpose
TBD - created by archiving change add-terraform-infrastructure. Update Purpose after archive.
## Requirements
### Requirement: Infrastructure as Code Management
The system SHALL provide Infrastructure as Code (IaC) using Terraform and Terragrunt to provision and manage AWS infrastructure across multiple environments.

#### Scenario: Initialize infrastructure for new environment
- **WHEN** a developer runs terragrunt init in an environment directory
- **THEN** Terraform state backend is configured with S3 and DynamoDB locking
- **AND** all required providers are downloaded and initialized

#### Scenario: Apply infrastructure changes
- **WHEN** infrastructure changes are applied using terragrunt apply
- **THEN** AWS resources are provisioned according to module specifications
- **AND** state is stored remotely in S3 with locking enabled
- **AND** outputs are displayed showing critical resource identifiers

### Requirement: Multi-Environment Support
The system SHALL support separate QA and Production environments with isolated infrastructure and different resource sizing.

#### Scenario: Provision QA environment
- **WHEN** terragrunt is applied in the qa environment directory
- **THEN** resources are created with QA-specific sizing (t3.small EC2, db.t3.micro RDS)
- **AND** resources are tagged with environment=qa
- **AND** single AZ deployment is used to minimize costs

#### Scenario: Provision Production environment
- **WHEN** terragrunt is applied in the prod environment directory
- **THEN** resources are created with production sizing (t3.medium EC2, db.t3.small RDS)
- **AND** resources are tagged with environment=prod
- **AND** Multi-AZ deployment is enabled for high availability

### Requirement: Network Infrastructure
The system SHALL provision a VPC with public and private subnets across multiple availability zones.

#### Scenario: Create VPC with subnets
- **WHEN** the VPC module is applied
- **THEN** a VPC is created with configurable CIDR block
- **AND** public subnets are created in at least 2 availability zones
- **AND** private subnets are created in at least 2 availability zones
- **AND** an Internet Gateway is attached to the VPC
- **AND** NAT Gateways are provisioned for private subnet internet access

#### Scenario: Configure route tables
- **WHEN** the VPC module is applied
- **THEN** public subnet route tables route 0.0.0.0/0 to Internet Gateway
- **AND** private subnet route tables route 0.0.0.0/0 to NAT Gateway
- **AND** route table associations are created for all subnets

### Requirement: Database Infrastructure
The system SHALL provision RDS PostgreSQL 15 instances in private subnets with automated backups.

#### Scenario: Create RDS instance
- **WHEN** the RDS module is applied
- **THEN** a PostgreSQL 15 database instance is created
- **AND** the instance is placed in private subnets
- **AND** security groups allow access only from EC2 security groups
- **AND** automated backups are enabled with configurable retention period

#### Scenario: Configure database parameters
- **WHEN** the RDS module is applied
- **THEN** a parameter group is created for PostgreSQL optimization
- **AND** connection pooling parameters are configured
- **AND** maintenance windows are set to minimize disruption

### Requirement: Compute Infrastructure
The system SHALL provision EC2 instances with Docker installed and IAM roles for ECR access.

#### Scenario: Create EC2 instances
- **WHEN** the EC2 module is applied
- **THEN** EC2 instances are created with specified instance type
- **AND** instances are placed in public subnets for direct access
- **AND** security groups allow SSH (22), HTTP (80), and HTTPS (443)
- **AND** IAM instance profiles are attached with ECR pull permissions

#### Scenario: Configure user data
- **WHEN** EC2 instances are launched
- **THEN** Docker and Docker Compose are installed via user data script
- **AND** AWS CLI is installed for ECR authentication
- **AND** application secrets are fetched from AWS Secrets Manager
- **AND** environment variables are configured for the application

### Requirement: Container Registry
The system SHALL provision ECR repositories for storing Docker images with lifecycle policies.

#### Scenario: Create ECR repositories
- **WHEN** the ECR module is applied
- **THEN** separate repositories are created for api and web applications
- **AND** lifecycle policies remove untagged images after 7 days
- **AND** lifecycle policies keep only the last 10 tagged images
- **AND** repository policies allow access from GitHub Actions OIDC role

### Requirement: Load Balancing
The system SHALL provision an Application Load Balancer to distribute traffic to EC2 instances.

#### Scenario: Create Application Load Balancer
- **WHEN** the ALB module is applied
- **THEN** an ALB is created in public subnets
- **AND** target groups are created for API and Web applications
- **AND** health checks are configured to monitor application endpoints
- **AND** listeners are configured for HTTP (80) and HTTPS (443)

#### Scenario: Configure HTTPS
- **WHEN** the ALB module is applied with ACM certificate ARN
- **THEN** HTTPS listener is configured with the SSL certificate
- **AND** HTTP traffic is redirected to HTTPS
- **AND** security policies use TLS 1.2 or higher

### Requirement: DNS Management
The system SHALL provision Route53 hosted zones and DNS records for environment-specific subdomains.

#### Scenario: Create DNS records for QA
- **WHEN** the Route53 module is applied for QA environment
- **THEN** A records are created pointing to the QA ALB
- **AND** subdomain follows the pattern qa.domain.com
- **AND** TTL is set to 300 seconds for faster propagation

#### Scenario: Create DNS records for Production
- **WHEN** the Route53 module is applied for Production environment
- **THEN** A records are created pointing to the Production ALB
- **AND** primary domain or prod.domain.com is configured
- **AND** TTL is set appropriately for production traffic

### Requirement: Caching Layer
The system SHALL provision ElastiCache Redis clusters for session storage and caching.

#### Scenario: Create Redis cluster
- **WHEN** the Redis module is applied
- **THEN** an ElastiCache Redis cluster is created
- **AND** the cluster is placed in private subnets
- **AND** security groups allow access only from EC2 instances
- **AND** persistence is configured with AOF (appendonly) mode

#### Scenario: Configure Redis parameters
- **WHEN** the Redis module is applied
- **THEN** a parameter group is created with appendonly enabled
- **AND** maxmemory policy is set to allkeys-lru
- **AND** cluster is configured with automatic failover in production

### Requirement: State Management
The system SHALL use S3 for Terraform state storage and DynamoDB for state locking.

#### Scenario: Configure remote state backend
- **WHEN** Terragrunt initializes with remote state configuration
- **THEN** an S3 bucket is created for state files if it does not exist
- **AND** versioning is enabled on the S3 bucket
- **AND** server-side encryption is enabled with AES256
- **AND** a DynamoDB table is created for state locking
- **AND** state files are organized by environment and component

#### Scenario: Lock state during operations
- **WHEN** terraform apply or plan is executed
- **THEN** a lock is acquired in DynamoDB before making changes
- **AND** concurrent operations are blocked until the lock is released
- **AND** lock includes metadata about the user and operation

### Requirement: Secrets Management
The system SHALL use AWS Secrets Manager to store and retrieve sensitive configuration values.

#### Scenario: Store application secrets
- **WHEN** infrastructure is provisioned
- **THEN** AWS Secrets Manager secrets are created for each environment
- **AND** secrets include database credentials, JWT secrets, OAuth credentials
- **AND** secrets are encrypted at rest with KMS
- **AND** IAM policies restrict access to EC2 instance roles only

#### Scenario: Retrieve secrets at runtime
- **WHEN** EC2 instances start up
- **THEN** user data scripts fetch secrets from AWS Secrets Manager
- **AND** secrets are injected as environment variables for Docker containers
- **AND** secrets are never logged or written to disk in plain text

### Requirement: Continuous Integration and Deployment
The system SHALL provide GitHub Actions workflows for automated building and deployment.

#### Scenario: Build and push Docker images
- **WHEN** code is pushed to the develop or main branch
- **THEN** Docker images are built for api and web applications
- **AND** images are tagged with git commit SHA and environment
- **AND** images are pushed to corresponding ECR repositories
- **AND** build fails if any security vulnerabilities are detected

#### Scenario: Deploy to QA automatically
- **WHEN** code is pushed to the develop branch
- **THEN** Docker images are built and pushed to ECR
- **AND** deployment script SSHs into QA EC2 instances
- **AND** latest images are pulled from ECR
- **AND** Prisma database migrations are executed
- **AND** Docker containers are restarted with new images
- **AND** health checks verify successful deployment

#### Scenario: Deploy to Production with approval
- **WHEN** a deployment to production is triggered
- **THEN** workflow requires manual approval before proceeding
- **AND** Docker images are pulled from ECR
- **AND** database migrations are executed with rollback plan
- **AND** containers are restarted with zero-downtime strategy
- **AND** health checks verify successful deployment
- **AND** rollback is triggered automatically if health checks fail

### Requirement: Monitoring and Logging
The system SHALL configure CloudWatch for application logging and infrastructure monitoring.

#### Scenario: Collect application logs
- **WHEN** applications run on EC2 instances
- **THEN** Docker container logs are streamed to CloudWatch log groups
- **AND** log groups are organized by environment and application
- **AND** log retention is set to 30 days for QA, 90 days for production
- **AND** logs are searchable and filterable in CloudWatch Insights

#### Scenario: Monitor infrastructure metrics
- **WHEN** infrastructure is running
- **THEN** CloudWatch alarms are configured for critical metrics
- **AND** alarms monitor EC2 CPU utilization, RDS connections, ALB latency
- **AND** alarm notifications are sent via SNS
- **AND** CloudWatch dashboards display key performance indicators

#### Scenario: Store ALB access logs
- **WHEN** the ALB receives traffic
- **THEN** access logs are stored in an S3 bucket
- **AND** logs include request details, response times, client IPs
- **AND** logs are encrypted at rest
- **AND** lifecycle policies archive logs to Glacier after 90 days

### Requirement: Security Groups
The system SHALL configure security groups following the principle of least privilege.

#### Scenario: Configure EC2 security groups
- **WHEN** EC2 instances are provisioned
- **THEN** security groups allow SSH only from specified IP ranges
- **AND** HTTP and HTTPS are allowed from ALB security group only
- **AND** egress rules allow all traffic for package installation
- **AND** no ports are exposed to 0.0.0.0/0 except via ALB

#### Scenario: Configure RDS security groups
- **WHEN** RDS instances are provisioned
- **THEN** security groups allow PostgreSQL port 5432 only from EC2 security group
- **AND** no public access is allowed
- **AND** egress rules are restricted to necessary targets only

#### Scenario: Configure Redis security groups
- **WHEN** Redis clusters are provisioned
- **THEN** security groups allow Redis port 6379 only from EC2 security group
- **AND** no public access is allowed
- **AND** ingress is restricted to application subnets only

### Requirement: Tagging Strategy
The system SHALL apply consistent tags to all AWS resources for cost tracking and management.

#### Scenario: Tag resources
- **WHEN** any AWS resource is created
- **THEN** tags include Project, Environment, ManagedBy keys
- **AND** Project tag is set to milky-way-admin-panel
- **AND** Environment tag is set to qa or prod
- **AND** ManagedBy tag is set to terraform
- **AND** additional custom tags can be specified per module

### Requirement: Production-Ready Dockerfiles
The system SHALL provide optimized multi-stage Dockerfiles for production deployments.

#### Scenario: Build API Docker image
- **WHEN** the API Dockerfile is built
- **THEN** a multi-stage build is used to minimize image size
- **AND** dependencies are installed in a separate stage
- **AND** Prisma client is generated during build
- **AND** production dependencies only are included in final image
- **AND** non-root user is used to run the application
- **AND** health check endpoint is exposed

#### Scenario: Build Web Docker image
- **WHEN** the Web Dockerfile is built
- **THEN** a multi-stage build is used to minimize image size
- **AND** Next.js is built in production mode
- **AND** only necessary files are copied to final image
- **AND** non-root user is used to run the application
- **AND** static assets are optimized

### Requirement: Infrastructure Documentation
The system SHALL provide comprehensive documentation for infrastructure setup and operations.

#### Scenario: Setup new infrastructure
- **WHEN** a developer reads the infrastructure README
- **THEN** prerequisites are clearly listed (Terraform, Terragrunt, AWS CLI)
- **AND** step-by-step setup instructions are provided
- **AND** environment-specific configuration is documented
- **AND** common troubleshooting scenarios are included

#### Scenario: Perform operational tasks
- **WHEN** an operator needs to perform common tasks
- **THEN** runbook provides procedures for deployment, rollback, scaling
- **AND** emergency procedures are documented
- **AND** monitoring and alerting setup is explained
- **AND** backup and restore procedures are provided

