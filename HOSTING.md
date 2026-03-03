# AWS Hosting Guide for creAItr.

This guide provides step-by-step instructions to deploy the creAItr. application on AWS infrastructure.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AWS Services Required](#aws-services-required)
3. [Prerequisites](#prerequisites)
4. [Step 1: AWS Account Setup](#step-1-aws-account-setup)
5. [Step 2: MongoDB Setup (DocumentDB)](#step-2-mongodb-setup-documentdb)
6. [Step 3: Backend Deployment (EC2 + Elastic Beanstalk)](#step-3-backend-deployment-ec2--elastic-beanstalk)
7. [Step 4: Frontend Deployment (S3 + CloudFront)](#step-4-frontend-deployment-s3--cloudfront)
8. [Step 5: File Storage (S3 for ChromaDB)](#step-5-file-storage-s3-for-chromadb)
9. [Step 6: Domain & SSL Setup](#step-6-domain--ssl-setup)
10. [Step 7: Environment Variables & Secrets](#step-7-environment-variables--secrets)
11. [Step 8: Monitoring & Logging](#step-8-monitoring--logging)
12. [Cost Estimation](#cost-estimation)
13. [Deployment Checklist](#deployment-checklist)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                           │
│                                                             │
│  ┌──────────────┐      ┌─────────────────┐                  │
│  │ CloudFront   │──────│ S3 Bucket       │                  │
│  │ (CDN)        │      │ (Frontend)      │                  │
│  └──────────────┘      └─────────────────┘                  │
│         │                                                   │
│         │                                                   │
│  ┌──────▼───────────────────────────────────┐               │
│  │  Application Load Balancer (ALB)         │               │
│  └──────┬───────────────────────────────────┘               │
│         │                                                   │
│  ┌──────▼──────────┐      ┌─────────────────┐               │
│  │ EC2 / Elastic   │──────│ DocumentDB      │               │
│  │ Beanstalk       │      │ (MongoDB)       │               │
│  │ (Backend)       │      └─────────────────┘               │
│  └─────────────────┘                                        │
│         │                                                   │
│  ┌──────▼──────────┐      ┌─────────────────┐               │
│  │ S3 Bucket       │      │ Secrets Manager │               │
│  │ (ChromaDB/      │      │ (API Keys)      │               │
│  │  Uploads)       │      └─────────────────┘               │
│  └─────────────────┘                                        │
│                                                             │
│  ┌─────────────────┐      ┌─────────────────┐               │
│  │ CloudWatch      │      │ Route 53        │               │
│  │ (Monitoring)    │      │ (DNS)           │               │
│  └─────────────────┘      └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ AWS Services Required

| Service                          | Purpose                         | Estimated Monthly Cost           |
| -------------------------------- | ------------------------------- | -------------------------------- |
| **EC2** or **Elastic Beanstalk** | Backend Flask API hosting       | $15-50 (t3.small-medium)         |
| **DocumentDB**                   | MongoDB-compatible database     | $50-200 (smallest instance)      |
| **S3**                           | Frontend hosting + file storage | $5-20                            |
| **CloudFront**                   | CDN for frontend                | $5-15                            |
| **Application Load Balancer**    | Traffic distribution            | $16-25                           |
| **Route 53**                     | DNS management                  | $0.50-2                          |
| **Secrets Manager**              | API key storage                 | $1-5                             |
| **CloudWatch**                   | Logging and monitoring          | $5-15                            |
| **Certificate Manager**          | SSL/TLS certificates            | Free                             |
| **VPC**                          | Network isolation               | Free (data transfer costs apply) |

**Total Estimated Cost: $100-350/month** (varies with traffic and usage)

---

## 📦 Prerequisites

### Local Requirements

- AWS Account with billing enabled
- AWS CLI installed and configured
- Node.js 18+ and npm
- Python 3.8+
- Git
- Domain name (optional but recommended)

### API Keys & Services

- NVIDIA API Key (for AI model)
- NewsAPI Key
- Cloudinary Account (Cloud Name, API Key, API Secret)
- YouTube API Key (optional)
- Google OAuth credentials (for authentication)

### Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download and run: https://awscli.amazonaws.com/AWSCLIV2.msi
```

### Configure AWS CLI

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

---

## 🚀 Step 1: AWS Account Setup

### 1.1 Create AWS Account

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the registration process
4. Add payment method
5. Verify identity

### 1.2 Create IAM User for Deployment

```bash
# Create IAM user via AWS Console
# 1. Go to IAM → Users → Add User
# 2. Username: creaitr-deployer
# 3. Access type: Programmatic access
# 4. Attach policies:
#    - AmazonEC2FullAccess
#    - AmazonS3FullAccess
#    - AWSElasticBeanstalkFullAccess
#    - AmazonDocumentDBFullAccess
#    - CloudFrontFullAccess
#    - AWSCertificateManagerFullAccess
#    - SecretsManagerReadWrite
#    - CloudWatchFullAccess
#    - AmazonRoute53FullAccess
# 5. Download credentials CSV
```

### 1.3 Set Up Billing Alerts

1. Go to AWS Billing Dashboard
2. Click "Billing preferences"
3. Enable "Receive Billing Alerts"
4. Go to CloudWatch → Alarms → Create Alarm
5. Set threshold (e.g., $100/month)
6. Add email notification

---

## 🗄️ Step 2: MongoDB Setup (DocumentDB)

### Option A: AWS DocumentDB (Recommended for Production)

#### 2.1 Create DocumentDB Cluster

```bash
# Via AWS Console:
# 1. Go to Amazon DocumentDB
# 2. Click "Create cluster"
# 3. Configuration:
#    - Cluster identifier: creaitr-db
#    - Engine version: 5.0
#    - Instance class: db.t3.medium (smallest)
#    - Number of instances: 1 (can scale later)
#    - Username: admin
#    - Password: [Create strong password]
#    - VPC: Create new or use default
#    - Subnet group: Create new
#    - Security group: Create new (creaitr-db-sg)
# 4. Click "Create cluster"
# 5. Wait 10-15 minutes for provisioning
```

#### 2.2 Configure Security Group

```bash
# Via AWS Console:
# 1. Go to EC2 → Security Groups
# 2. Find "creaitr-db-sg"
# 3. Edit Inbound Rules:
#    - Type: Custom TCP
#    - Port: 27017
#    - Source: [Your backend security group ID]
#    - Description: Allow backend access
# 4. Save rules
```

#### 2.3 Get Connection String

```bash
# Via AWS Console:
# 1. Go to DocumentDB → Clusters → creaitr-db
# 2. Click "Connectivity & security"
# 3. Copy the connection string:
#    mongodb://admin:[password]@creaitr-db.cluster-xxxxx.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

# 4. Download TLS certificate:
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

### Option B: MongoDB Atlas (Alternative - Easier Setup)

#### 2.1 Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier
3. Create new cluster (M0 Free tier or M10 for production)
4. Choose AWS as cloud provider
5. Select same region as your EC2 instances

#### 2.2 Configure Network Access

1. Go to Network Access
2. Add IP Address: `0.0.0.0/0` (allow from anywhere)
3. Or add specific EC2 IP addresses

#### 2.3 Create Database User

1. Go to Database Access
2. Add new database user
3. Username: `creaitr_user`
4. Password: [Generate strong password]
5. Database User Privileges: Read and write to any database

#### 2.4 Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string:
   ```
   mongodb+srv://creaitr_user:[password]@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 🖥️ Step 3: Backend Deployment (EC2 + Elastic Beanstalk)

### Option A: Elastic Beanstalk (Recommended - Easier)

#### 3.1 Prepare Backend for Deployment

```bash
cd backend_server

# Create .ebextensions directory for configuration
mkdir -p .ebextensions
```

Create `.ebextensions/01_packages.config`:

```yaml
packages:
  yum:
    git: []
    gcc: []
    python3-devel: []
```

Create `.ebextensions/02_python.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: backend:app
  aws:elasticbeanstalk:application:environment:
    PYTHONPATH: "/var/app/current:$PYTHONPATH"
```

#### 3.2 Create Procfile

```bash
# Create Procfile in backend_server/
cat > Procfile << EOF
web: gunicorn backend:app --bind 0.0.0.0:8000 --workers 4 --timeout 120
EOF
```

#### 3.3 Update requirements.txt

```bash
# Add gunicorn to requirements.txt
echo "gunicorn" >> requirements.txt
```

#### 3.4 Initialize Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p python-3.11 creaitr-backend --region us-east-1

# Create environment
eb create creaitr-backend-prod \
  --instance-type t3.small \
  --envvars \
    FLASK_ENV=production,\
    PORT=8000

# This will take 5-10 minutes
```

#### 3.5 Configure Environment Variables

```bash
# Set environment variables via EB CLI
eb setenv \
  NVIDIA_API_KEY=your_nvidia_api_key \
  NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1 \
  MODEL_NAME=nvidia/llama-3.1-nemotron-70b-instruct \
  NEWS_API_KEY=your_news_api_key \
  MONGODB_URI=your_mongodb_connection_string \
  JWT_SECRET_KEY=your_jwt_secret \
  CLOUDINARY_CLOUD_NAME=your_cloud_name \
  CLOUDINARY_API_KEY=your_cloudinary_key \
  CLOUDINARY_API_SECRET=your_cloudinary_secret \
  YOUTUBE_API_KEY=your_youtube_key \
  DB_PATH=/tmp/my_local_db

# Or set via AWS Console:
# Elastic Beanstalk → Environments → Configuration → Software → Environment properties
```

#### 3.6 Deploy Backend

```bash
# Deploy application
eb deploy

# Check status
eb status

# View logs
eb logs

# Open in browser to test
eb open
```

#### 3.7 Configure Health Checks

```bash
# Via AWS Console:
# 1. Elastic Beanstalk → Environments → Configuration
# 2. Edit "Load balancer"
# 3. Processes → default → Edit
# 4. Health check path: /health (you need to add this endpoint)
# 5. Save
```

Add health check endpoint to `backend.py`:

```python
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200
```

### Option B: EC2 Manual Setup (More Control)

#### 3.8 Launch EC2 Instance

```bash
# Via AWS Console:
# 1. Go to EC2 → Launch Instance
# 2. Configuration:
#    - Name: creaitr-backend
#    - AMI: Ubuntu Server 22.04 LTS
#    - Instance type: t3.small (2 vCPU, 2GB RAM)
#    - Key pair: Create new or use existing
#    - Network: Default VPC
#    - Security group: Create new
#      * SSH (22) from your IP
#      * HTTP (80) from anywhere
#      * HTTPS (443) from anywhere
#      * Custom TCP (5000) from anywhere
#    - Storage: 20GB gp3
# 3. Launch instance
```

#### 3.9 Connect to EC2 Instance

```bash
# Download your key pair (.pem file)
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@[EC2-PUBLIC-IP]
```

#### 3.10 Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install nginx
sudo apt install nginx -y

# Install git
sudo apt install git -y

# Install supervisor (process manager)
sudo apt install supervisor -y
```

#### 3.11 Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/creaitr
sudo chown ubuntu:ubuntu /var/www/creaitr

# Clone repository
cd /var/www/creaitr
git clone https://github.com/yourusername/creaitr.git .

# Create virtual environment
cd backend_server
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn
```

#### 3.12 Create Environment File

```bash
# Create .env file
cat > /var/www/creaitr/backend_server/.env << EOF
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
MODEL_NAME=nvidia/llama-3.1-nemotron-70b-instruct
NEWS_API_KEY=your_news_api_key
RSS_URL=your_rss_feed_url
MONGODB_URI=your_mongodb_connection_string
DB_PATH=/var/www/creaitr/my_local_db
JWT_SECRET_KEY=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
YOUTUBE_API_KEY=your_youtube_key
PORT=5000
EOF

# Secure the file
chmod 600 /var/www/creaitr/backend_server/.env
```

#### 3.13 Configure Supervisor

```bash
# Create supervisor config
sudo nano /etc/supervisor/conf.d/creaitr.conf
```

Add this configuration:

```ini
[program:creaitr]
directory=/var/www/creaitr/backend_server
command=/var/www/creaitr/backend_server/venv/bin/gunicorn backend:app --bind 127.0.0.1:5000 --workers 4 --timeout 120
user=ubuntu
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/var/log/creaitr/err.log
stdout_logfile=/var/log/creaitr/out.log
environment=PATH="/var/www/creaitr/backend_server/venv/bin"
```

```bash
# Create log directory
sudo mkdir -p /var/log/creaitr
sudo chown ubuntu:ubuntu /var/log/creaitr

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start creaitr

# Check status
sudo supervisorctl status creaitr
```

#### 3.14 Configure Nginx

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/creaitr
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 public IP

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for streaming responses
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/creaitr /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable nginx on boot
sudo systemctl enable nginx
```

#### 3.15 Test Backend

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check via public IP
curl http://[EC2-PUBLIC-IP]/health
```

---

## 🌐 Step 4: Frontend Deployment (S3 + CloudFront)

### 4.1 Build Frontend

```bash
# On your local machine
cd frontend

# Update API endpoint in your code
# Edit src/config.js or wherever API URL is defined
# Change to your backend URL (EC2 or Elastic Beanstalk URL)

# Build production bundle
npm run build

# This creates a 'dist' folder with optimized files
```

### 4.2 Create S3 Bucket for Frontend

```bash
# Create bucket (replace with unique name)
aws s3 mb s3://creaitr-frontend --region us-east-1

# Enable static website hosting
aws s3 website s3://creaitr-frontend \
  --index-document index.html \
  --error-document index.html
```

### 4.3 Configure Bucket Policy

```bash
# Create bucket policy file
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::creaitr-frontend/*"
    }
  ]
}
EOF

# Apply policy
aws s3api put-bucket-policy \
  --bucket creaitr-frontend \
  --policy file://bucket-policy.json
```

### 4.4 Upload Frontend Files

```bash
# Upload dist folder to S3
aws s3 sync dist/ s3://creaitr-frontend/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html separately with no cache
aws s3 cp dist/index.html s3://creaitr-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

### 4.5 Create CloudFront Distribution

```bash
# Via AWS Console:
# 1. Go to CloudFront → Create Distribution
# 2. Origin Settings:
#    - Origin domain: creaitr-frontend.s3.us-east-1.amazonaws.com
#    - Origin path: (leave empty)
#    - Name: creaitr-frontend-origin
#    - Origin access: Public
# 3. Default Cache Behavior:
#    - Viewer protocol policy: Redirect HTTP to HTTPS
#    - Allowed HTTP methods: GET, HEAD, OPTIONS
#    - Cache policy: CachingOptimized
# 4. Settings:
#    - Price class: Use all edge locations (or choose based on budget)
#    - Alternate domain names (CNAMEs): your-domain.com, www.your-domain.com
#    - Custom SSL certificate: Request certificate (see Step 6)
#    - Default root object: index.html
# 5. Create distribution
# 6. Wait 10-15 minutes for deployment
```

### 4.6 Configure Error Pages for SPA

```bash
# Via AWS Console:
# 1. CloudFront → Distributions → Your distribution
# 2. Error Pages tab → Create Custom Error Response
# 3. Add these error responses:
#    - HTTP Error Code: 403
#      Response Page Path: /index.html
#      HTTP Response Code: 200
#    - HTTP Error Code: 404
#      Response Page Path: /index.html
#      HTTP Response Code: 200
```

### 4.7 Create Deployment Script

Create `frontend/deploy.sh`:

```bash
#!/bin/bash

# Build frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://creaitr-frontend/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://creaitr-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

# Invalidate CloudFront cache
DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

```bash
# Make executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

---

## 📦 Step 5: File Storage (S3 for ChromaDB)

### 5.1 Create S3 Bucket for Data

```bash
# Create bucket for ChromaDB and uploads
aws s3 mb s3://creaitr-data --region us-east-1

# Create folder structure
aws s3api put-object --bucket creaitr-data --key chromadb/
aws s3api put-object --bucket creaitr-data --key uploads/
```

### 5.2 Configure Bucket Versioning

```bash
# Enable versioning for data protection
aws s3api put-bucket-versioning \
  --bucket creaitr-data \
  --versioning-configuration Status=Enabled
```

### 5.3 Configure Lifecycle Policy

```bash
# Create lifecycle policy to manage costs
cat > lifecycle-policy.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket creaitr-data \
  --lifecycle-configuration file://lifecycle-policy.json
```

### 5.4 Update Backend to Use S3 for ChromaDB

You'll need to modify your backend to sync ChromaDB with S3. Add to `backend.py`:

```python
import boto3
import os

s3_client = boto3.client('s3')
BUCKET_NAME = 'creaitr-data'
CHROMADB_PREFIX = 'chromadb/'

def sync_chromadb_to_s3():
    """Upload local ChromaDB to S3"""
    local_db_path = os.getenv('DB_PATH', './my_local_db')
    for root, dirs, files in os.walk(local_db_path):
        for file in files:
            local_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_path, local_db_path)
            s3_key = f"{CHROMADB_PREFIX}{relative_path}"
            s3_client.upload_file(local_path, BUCKET_NAME, s3_key)

def sync_chromadb_from_s3():
    """Download ChromaDB from S3 to local"""
    local_db_path = os.getenv('DB_PATH', './my_local_db')
    os.makedirs(local_db_path, exist_ok=True)

    paginator = s3_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=CHROMADB_PREFIX):
        if 'Contents' in page:
            for obj in page['Contents']:
                s3_key = obj['Key']
                if s3_key.endswith('/'):
                    continue
                relative_path = s3_key[len(CHROMADB_PREFIX):]
                local_path = os.path.join(local_db_path, relative_path)
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                s3_client.download_file(BUCKET_NAME, s3_key, local_path)

# Call on startup
sync_chromadb_from_s3()

# Call periodically or after updates
# You can use a scheduled task or call after news updates
```

Add boto3 to `requirements.txt`:

```bash
echo "boto3" >> backend_server/requirements.txt
```

### 5.5 Configure IAM Role for EC2/EB

```bash
# Via AWS Console:
# 1. Go to IAM → Roles
# 2. Find your EC2/Elastic Beanstalk instance role
# 3. Attach policy: AmazonS3FullAccess (or create custom policy)
# 4. Custom policy example:
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": ["arn:aws:s3:::creaitr-data", "arn:aws:s3:::creaitr-data/*"]
    }
  ]
}
```

---

## 🔒 Step 6: Domain & SSL Setup

### 6.1 Register Domain (if you don't have one)

```bash
# Via AWS Route 53:
# 1. Go to Route 53 → Registered domains
# 2. Register domain (e.g., creaitr.com)
# 3. Complete registration ($12-15/year for .com)
```

### 6.2 Create Hosted Zone

```bash
# If domain registered elsewhere:
# 1. Route 53 → Hosted zones → Create hosted zone
# 2. Domain name: your-domain.com
# 3. Type: Public hosted zone
# 4. Create
# 5. Note the NS (nameserver) records
# 6. Update nameservers at your domain registrar
```

### 6.3 Request SSL Certificate

```bash
# Via AWS Certificate Manager:
# 1. Go to Certificate Manager (us-east-1 region for CloudFront)
# 2. Request certificate
# 3. Domain names:
#    - your-domain.com
#    - *.your-domain.com (wildcard for subdomains)
# 4. Validation method: DNS validation
# 5. Request
# 6. Click "Create records in Route 53" (if using Route 53)
# 7. Wait 5-30 minutes for validation
```

### 6.4 Configure DNS Records

```bash
# Via Route 53:
# 1. Go to Hosted zones → your-domain.com
# 2. Create Record:
#    - Record name: (leave empty for root domain)
#    - Record type: A
#    - Alias: Yes
#    - Route traffic to: Alias to CloudFront distribution
#    - Choose your distribution
#    - Create
# 3. Create Record for www:
#    - Record name: www
#    - Record type: A
#    - Alias: Yes
#    - Route traffic to: Alias to CloudFront distribution
#    - Choose your distribution
#    - Create
# 4. Create Record for API:
#    - Record name: api
#    - Record type: A
#    - Alias: No
#    - Value: [Your EC2 or Load Balancer IP]
#    - Create
```

### 6.5 Update CloudFront with SSL

```bash
# Via AWS Console:
# 1. CloudFront → Distributions → Your distribution → Edit
# 2. Alternate domain names: your-domain.com, www.your-domain.com
# 3. Custom SSL certificate: Select your certificate
# 4. Save changes
# 5. Wait for deployment (5-10 minutes)
```

### 6.6 Configure SSL for Backend (if using EC2)

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@[EC2-IP]

# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d api.your-domain.com

# Certbot will automatically configure nginx
# Certificate auto-renews via cron job
```

---

## 🔐 Step 7: Environment Variables & Secrets

### 7.1 Store Secrets in AWS Secrets Manager

```bash
# Create secret for API keys
aws secretsmanager create-secret \
  --name creaitr/api-keys \
  --description "API keys for creAItr application" \
  --secret-string '{
    "NVIDIA_API_KEY": "your_nvidia_api_key",
    "NEWS_API_KEY": "your_news_api_key",
    "CLOUDINARY_API_KEY": "your_cloudinary_key",
    "CLOUDINARY_API_SECRET": "your_cloudinary_secret",
    "YOUTUBE_API_KEY": "your_youtube_key",
    "JWT_SECRET_KEY": "your_jwt_secret"
  }'

# Create secret for database
aws secretsmanager create-secret \
  --name creaitr/database \
  --description "Database connection string" \
  --secret-string '{
    "MONGODB_URI": "your_mongodb_connection_string"
  }'
```

### 7.2 Update Backend to Use Secrets Manager

Add to `backend.py`:

```python
import boto3
import json

def get_secret(secret_name):
    """Retrieve secret from AWS Secrets Manager"""
    client = boto3.client('secretsmanager', region_name='us-east-1')
    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except Exception as e:
        print(f"Error retrieving secret: {e}")
        return None

# Load secrets on startup
api_secrets = get_secret('creaitr/api-keys')
db_secrets = get_secret('creaitr/database')

if api_secrets:
    os.environ['NVIDIA_API_KEY'] = api_secrets.get('NVIDIA_API_KEY', '')
    os.environ['NEWS_API_KEY'] = api_secrets.get('NEWS_API_KEY', '')
    # ... set other keys
```

### 7.3 Grant IAM Permissions

```bash
# Attach policy to EC2/EB role to read secrets
# Via AWS Console:
# 1. IAM → Roles → Your instance role
# 2. Attach policy: SecretsManagerReadWrite
# Or create custom policy:
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": ["arn:aws:secretsmanager:us-east-1:*:secret:creaitr/*"]
    }
  ]
}
```

---

## 📊 Step 8: Monitoring & Logging

### 8.1 Configure CloudWatch Logs

#### For Elastic Beanstalk:

```bash
# Via AWS Console:
# 1. Elastic Beanstalk → Configuration → Software
# 2. Enable log streaming to CloudWatch
# 3. Log retention: 7 days (or as needed)
# 4. Save
```

#### For EC2:

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Create config file
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

Add configuration:

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/creaitr/out.log",
            "log_group_name": "/aws/ec2/creaitr/application",
            "log_stream_name": "{instance_id}/stdout"
          },
          {
            "file_path": "/var/log/creaitr/err.log",
            "log_group_name": "/aws/ec2/creaitr/application",
            "log_stream_name": "{instance_id}/stderr"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/creaitr/nginx",
            "log_stream_name": "{instance_id}/access"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/creaitr/nginx",
            "log_stream_name": "{instance_id}/error"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CreAItr",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          { "name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent" },
          {
            "name": "cpu_usage_iowait",
            "rename": "CPU_IOWAIT",
            "unit": "Percent"
          }
        ],
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          { "name": "used_percent", "rename": "DISK_USED", "unit": "Percent" }
        ],
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ]
      }
    }
  }
}
```

```bash
# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Enable on boot
sudo systemctl enable amazon-cloudwatch-agent
```

### 8.2 Create CloudWatch Alarms

#### CPU Utilization Alarm:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name creaitr-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:creaitr-alerts
```

#### Memory Alarm:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name creaitr-high-memory \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name MEM_USED \
  --namespace CreAItr \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:creaitr-alerts
```

#### Disk Space Alarm:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name creaitr-low-disk \
  --alarm-description "Alert when disk usage exceeds 80%" \
  --metric-name DISK_USED \
  --namespace CreAItr \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:creaitr-alerts
```

### 8.3 Create SNS Topic for Alerts

```bash
# Create SNS topic
aws sns create-topic --name creaitr-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:creaitr-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription via email
```

### 8.4 Set Up CloudWatch Dashboard

```bash
# Via AWS Console:
# 1. CloudWatch → Dashboards → Create dashboard
# 2. Name: creaitr-monitoring
# 3. Add widgets:
#    - Line graph: CPU Utilization
#    - Line graph: Memory Usage
#    - Line graph: Disk Usage
#    - Number: Request Count
#    - Number: Error Count
#    - Log insights: Recent errors
# 4. Save dashboard
```

### 8.5 Application Performance Monitoring

Add logging to `backend.py`:

```python
import logging
from logging.handlers import RotatingFileHandler
import time

# Configure logging
if not app.debug:
    file_handler = RotatingFileHandler(
        '/var/log/creaitr/app.log',
        maxBytes=10240000,
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('CreAItr startup')

# Request logging middleware
@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    if hasattr(request, 'start_time'):
        duration = time.time() - request.start_time
        app.logger.info(
            f'{request.method} {request.path} - {response.status_code} - {duration:.3f}s'
        )
    return response

# Error logging
@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f'Unhandled exception: {str(e)}', exc_info=True)
    return jsonify({"error": "Internal server error"}), 500
```

---

## 💰 Cost Estimation

### Monthly Cost Breakdown (Estimated)

| Service                                    | Configuration         | Monthly Cost |
| ------------------------------------------ | --------------------- | ------------ |
| **EC2 (t3.small)**                         | 2 vCPU, 2GB RAM, 24/7 | $15-20       |
| **DocumentDB (db.t3.medium)**              | 1 instance            | $50-100      |
| **S3 Storage**                             | 50GB data + requests  | $5-10        |
| **CloudFront**                             | 100GB transfer        | $10-15       |
| **Application Load Balancer**              | Standard              | $16-20       |
| **Route 53**                               | 1 hosted zone         | $0.50        |
| **Secrets Manager**                        | 2 secrets             | $1           |
| **CloudWatch**                             | Logs + metrics        | $5-10        |
| **Data Transfer**                          | Outbound              | $5-20        |
| **NAT Gateway** (if using private subnets) | Optional              | $32          |

**Total: $107-206/month** (without NAT Gateway)
**Total: $139-238/month** (with NAT Gateway)

### Cost Optimization Tips

1. **Use Reserved Instances**: Save 30-60% on EC2 costs with 1-year commitment
2. **MongoDB Atlas Free Tier**: Use instead of DocumentDB for development ($0)
3. **CloudFront Price Class**: Use "Use Only North America and Europe" to reduce costs
4. **S3 Lifecycle Policies**: Move old data to Glacier ($0.004/GB vs $0.023/GB)
5. **Auto Scaling**: Scale down during low-traffic hours
6. **Spot Instances**: Use for non-critical workloads (70% discount)
7. **CloudWatch Log Retention**: Reduce to 3-7 days instead of indefinite

### Free Tier Benefits (First 12 Months)

- EC2: 750 hours/month of t2.micro or t3.micro
- S3: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- CloudFront: 50GB data transfer out, 2,000,000 HTTP/HTTPS requests
- DocumentDB: Not included in free tier
- Lambda: 1M free requests/month (if you use serverless approach)

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] AWS account created and billing configured
- [ ] IAM user created with necessary permissions
- [ ] AWS CLI installed and configured
- [ ] Domain name registered (optional)
- [ ] All API keys obtained (NVIDIA, NewsAPI, Cloudinary, YouTube)
- [ ] Google OAuth credentials configured
- [ ] Code tested locally

### Database Setup

- [ ] MongoDB/DocumentDB cluster created
- [ ] Database security groups configured
- [ ] Connection string obtained and tested
- [ ] Database user created with proper permissions

### Backend Deployment

- [ ] EC2 instance launched OR Elastic Beanstalk environment created
- [ ] Security groups configured (ports 22, 80, 443, 5000)
- [ ] Application code deployed
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Gunicorn/Supervisor configured
- [ ] Nginx configured (if using EC2)
- [ ] Health check endpoint working
- [ ] Backend accessible via public IP/domain

### Frontend Deployment

- [ ] Frontend built with production API URL
- [ ] S3 bucket created for frontend
- [ ] Static website hosting enabled
- [ ] Files uploaded to S3
- [ ] CloudFront distribution created
- [ ] Custom error pages configured (403, 404 → index.html)
- [ ] Frontend accessible via CloudFront URL

### File Storage

- [ ] S3 bucket created for data (ChromaDB, uploads)
- [ ] Bucket policies configured
- [ ] IAM roles configured for S3 access
- [ ] ChromaDB sync implemented
- [ ] File upload/download tested

### Domain & SSL

- [ ] Domain registered or configured
- [ ] Route 53 hosted zone created
- [ ] SSL certificate requested and validated
- [ ] DNS records created (A, CNAME)
- [ ] CloudFront configured with custom domain
- [ ] Backend SSL configured (if using custom domain)
- [ ] HTTPS working for both frontend and backend

### Security

- [ ] Secrets stored in AWS Secrets Manager
- [ ] IAM roles configured with least privilege
- [ ] Security groups properly restricted
- [ ] CORS configured correctly
- [ ] JWT secret key strong and secure
- [ ] Database not publicly accessible

### Monitoring

- [ ] CloudWatch logs configured
- [ ] CloudWatch alarms created
- [ ] SNS topic created for alerts
- [ ] Email subscriptions confirmed
- [ ] CloudWatch dashboard created
- [ ] Application logging implemented

### Testing

- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] AI chat functionality works
- [ ] Project creation works
- [ ] Kanban board works
- [ ] File uploads work
- [ ] All creative tools accessible
- [ ] Mobile responsiveness checked
- [ ] Cross-browser compatibility tested

### Post-Deployment

- [ ] DNS propagation complete (24-48 hours)
- [ ] SSL certificates active
- [ ] Monitoring alerts working
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team trained on deployment process
- [ ] Rollback plan documented

---

## 🔄 Continuous Deployment

### Set Up GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to Elastic Beanstalk
        run: |
          cd backend_server
          pip install awsebcli
          eb deploy creaitr-backend-prod

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to S3
        run: |
          cd frontend
          aws s3 sync dist/ s3://creaitr-frontend/ --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

Add secrets to GitHub:

1. Go to repository → Settings → Secrets and variables → Actions
2. Add:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `CLOUDFRONT_DISTRIBUTION_ID`

---

## 🆘 Troubleshooting

### Backend Issues

**Problem: Backend not starting**

```bash
# Check logs
sudo supervisorctl tail creaitr stderr
# or
eb logs

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Restart service
sudo supervisorctl restart creaitr
# or
eb restart
```

**Problem: Database connection failed**

```bash
# Test connection
python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGODB_URI'); print(client.server_info())"

# Check security group allows connection
# Check if IP is whitelisted (for Atlas)
```

**Problem: High memory usage**

```bash
# Check memory
free -h

# Check processes
top

# Restart application
sudo supervisorctl restart creaitr
```

### Frontend Issues

**Problem: API calls failing (CORS)**

- Check backend CORS configuration
- Verify API URL in frontend config
- Check CloudFront origin settings

**Problem: 404 on page refresh**

- Verify CloudFront error pages configured
- Check S3 bucket policy

**Problem: Old content showing**

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### SSL Issues

**Problem: Certificate not validating**

- Wait 30 minutes for DNS propagation
- Check DNS records in Route 53
- Verify CNAME records added

**Problem: Mixed content warnings**

- Ensure all API calls use HTTPS
- Check external resources (images, scripts) use HTTPS

### Performance Issues

**Problem: Slow response times**

```bash
# Check CPU/Memory
top

# Check disk space
df -h

# Check network
ping google.com

# Optimize database queries
# Add indexes to MongoDB collections
```

**Problem: High costs**

- Review CloudWatch metrics
- Check S3 storage usage
- Review CloudFront data transfer
- Consider Reserved Instances

---

## 📚 Additional Resources

### AWS Documentation

- [Elastic Beanstalk Developer Guide](https://docs.aws.amazon.com/elasticbeanstalk/)
- [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [S3 User Guide](https://docs.aws.amazon.com/s3/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [DocumentDB Developer Guide](https://docs.aws.amazon.com/documentdb/)

### Tutorials

- [Deploy Flask App to AWS](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-flask.html)
- [Host Static Website on S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Configure CloudFront with S3](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html)

### Tools

- [AWS Calculator](https://calculator.aws/) - Estimate costs
- [AWS Well-Architected Tool](https://aws.amazon.com/well-architected-tool/) - Review architecture
- [AWS Trusted Advisor](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/) - Optimization recommendations

---

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring dashboards** - Track application health
2. **Implement backup strategy** - Regular database backups
3. **Configure auto-scaling** - Handle traffic spikes
4. **Set up staging environment** - Test before production
5. **Implement CI/CD pipeline** - Automate deployments
6. **Add application monitoring** - Use AWS X-Ray or third-party tools
7. **Optimize performance** - CDN caching, database indexes
8. **Security audit** - Regular security reviews
9. **Disaster recovery plan** - Document recovery procedures
10. **Team training** - Ensure team can manage infrastructure

---

## 📞 Support

If you encounter issues:

1. Check AWS Service Health Dashboard
2. Review CloudWatch logs
3. Consult AWS documentation
4. Contact AWS Support (if you have a support plan)
5. Open an issue on the GitHub repository

---

**Congratulations! Your creAItr. application is now live on AWS! 🎉**

Remember to:

- Monitor costs regularly
- Keep dependencies updated
- Review security settings periodically
- Back up data regularly
- Document any custom configurations

---

_Last updated: March 2026_
