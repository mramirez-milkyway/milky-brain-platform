#!/bin/bash
set -e

# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
rm -f amazon-cloudwatch-agent.rpm

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Configure Docker to use ECR
aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_registry}

# Create systemd service for Docker login renewal (ECR tokens expire every 12 hours)
cat > /etc/systemd/system/ecr-login-renewal.service << 'EOF'
[Unit]
Description=Renew ECR Docker login token
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/aws ecr get-login-password --region ${aws_region} | /usr/bin/docker login --username AWS --password-stdin ${ecr_registry}
EOF

cat > /etc/systemd/system/ecr-login-renewal.timer << 'EOF'
[Unit]
Description=Renew ECR login every 10 hours

[Timer]
OnBootSec=10min
OnUnitActiveSec=10h

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable ecr-login-renewal.timer
systemctl start ecr-login-renewal.timer

# Fetch secrets from AWS Secrets Manager and create .env file
cat > /opt/app/fetch-secrets.sh << 'SCRIPT'
#!/bin/bash
set -e

SECRET_NAME="${environment}/app-secrets"
REGION="${aws_region}"

# Fetch secrets
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id $SECRET_NAME --region $REGION --query SecretString --output text 2>/dev/null || echo "{}")

# Parse and export environment variables
if [ "$SECRET_JSON" != "{}" ]; then
    echo "$SECRET_JSON" | jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' > /opt/app/.env
else
    # Create placeholder .env if secrets don't exist yet
    cat > /opt/app/.env << 'ENV'
DATABASE_URL=postgresql://admin:${db_endpoint}
REDIS_URL=redis://${redis_endpoint}
NODE_ENV=production
ENV
fi

# Add infrastructure-specific env vars
cat >> /opt/app/.env << 'ENV'
DB_HOST=${db_endpoint}
REDIS_HOST=${redis_endpoint}
ENV

chmod 600 /opt/app/.env
SCRIPT

chmod +x /opt/app/fetch-secrets.sh
/opt/app/fetch-secrets.sh

# Create docker-compose.yml placeholder
cat > /opt/app/docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  api:
    image: ${ecr_registry}/milky-way-admin-panel-api:latest
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "4000:4000"
    logging:
      driver: awslogs
      options:
        awslogs-region: ${aws_region}
        awslogs-group: /aws/ec2/${environment}/api
        awslogs-create-group: "true"

  web:
    image: ${ecr_registry}/milky-way-admin-panel-web:latest
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3000:3000"
    depends_on:
      - api
    logging:
      driver: awslogs
      options:
        awslogs-region: ${aws_region}
        awslogs-group: /aws/ec2/${environment}/web
        awslogs-create-group: "true"
COMPOSE

# Create deployment script
cat > /opt/app/deploy.sh << 'DEPLOY'
#!/bin/bash
set -e

cd /opt/app

# Renew ECR login
aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_registry}

# Fetch latest secrets
./fetch-secrets.sh

# Pull latest images
docker-compose pull

# Run database migrations
docker-compose run --rm api npx prisma migrate deploy || echo "Migration failed or not needed"

# Restart services
docker-compose up -d

# Clean up old images
docker image prune -f
DEPLOY

chmod +x /opt/app/deploy.sh

echo "User data execution completed successfully"
