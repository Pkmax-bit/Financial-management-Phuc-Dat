# Hướng Dẫn Setup AWS ECS cho Backend Enterprise

## 📋 Tổng Quan

Hướng dẫn này sẽ giúp bạn setup AWS ECS (Elastic Container Service) để host FastAPI backend với:
- ✅ Auto-scaling (2-10 instances)
- ✅ Load balancing
- ✅ High availability
- ✅ Monitoring

---

## 🚀 1. PREREQUISITES

- AWS Account
- AWS CLI installed
- Docker installed
- GitHub repository

---

## 📦 2. TẠO DOCKER IMAGE

### 2.1. Tạo Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 2.2. Build và Push Docker Image

```bash
# Build image
docker build -t financial-management-backend:latest ./backend

# Tag for ECR
docker tag financial-management-backend:latest \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/financial-management-backend:latest

# Login to ECR
aws ecr get-login-password --region REGION | \
  docker login --username AWS --password-stdin \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com

# Push image
docker push \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/financial-management-backend:latest
```

---

## 🏗️ 3. SETUP AWS ECS

### 3.1. Tạo ECR Repository

```bash
aws ecr create-repository \
  --repository-name financial-management-backend \
  --region us-east-1
```

### 3.2. Tạo ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name financial-management-cluster \
  --region us-east-1
```

### 3.3. Tạo Task Definition

Tạo file `task-definition.json`:

```json
{
  "family": "financial-management-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/financial-management-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:supabase-url"
        },
        {
          "name": "SUPABASE_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:supabase-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/financial-management-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region us-east-1
```

### 3.4. Tạo Application Load Balancer

```bash
# Create security group
aws ec2 create-security-group \
  --group-name financial-management-alb-sg \
  --description "Security group for ALB" \
  --region us-east-1

# Create ALB
aws elbv2 create-load-balancer \
  --name financial-management-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345 \
  --region us-east-1
```

### 3.5. Tạo Target Group

```bash
aws elbv2 create-target-group \
  --name financial-management-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-12345 \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-east-1
```

### 3.6. Tạo ECS Service

```bash
aws ecs create-service \
  --cluster financial-management-cluster \
  --service-name financial-management-backend-service \
  --task-definition financial-management-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-12345],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT_ID:targetgroup/financial-management-tg/12345,containerName=backend,containerPort=8000" \
  --region us-east-1
```

---

## 📈 4. SETUP AUTO-SCALING

### 4.1. Tạo Auto-Scaling Policy

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/financial-management-cluster/financial-management-backend-service \
  --min-capacity 2 \
  --max-capacity 10 \
  --region us-east-1

# CPU-based scaling
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/financial-management-cluster/financial-management-backend-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }' \
  --region us-east-1
```

---

## 🔐 5. SETUP SECRETS MANAGEMENT

### 5.1. Tạo Secrets trong AWS Secrets Manager

```bash
# Create Supabase URL secret
aws secretsmanager create-secret \
  --name supabase-url \
  --secret-string "https://your-project.supabase.co" \
  --region us-east-1

# Create Supabase Key secret
aws secretsmanager create-secret \
  --name supabase-key \
  --secret-string "your-supabase-key" \
  --region us-east-1
```

---

## 📊 6. SETUP MONITORING

### 6.1. CloudWatch Logs

```bash
# Create log group
aws logs create-log-group \
  --log-group-name /ecs/financial-management-backend \
  --region us-east-1
```

### 6.2. CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-utilization \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --region us-east-1
```

---

## 🚀 7. DEPLOYMENT WORKFLOW

### 7.1. CI/CD với GitHub Actions

Tạo `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: financial-management-backend
  ECS_SERVICE: financial-management-backend-service
  ECS_CLUSTER: financial-management-cluster
  ECS_TASK_DEFINITION: financial-management-backend

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Fill in the new image ID in the Amazon ECS task definition
      id: task-def
      uses: aws-actions/amazon-ecs-render-task-definition@v1
      with:
        task-definition: task-definition.json
        container-name: backend
        image: ${{ steps.build-image.outputs.image }}

    - name: Deploy Amazon ECS task definition
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: ${{ steps.task-def.outputs.task-definition }}
        service: ${{ env.ECS_SERVICE }}
        cluster: ${{ env.ECS_CLUSTER }}
        wait-for-service-stability: true
```

---

## ✅ 8. CHECKLIST

- [ ] AWS Account created
- [ ] ECR Repository created
- [ ] Docker image built and pushed
- [ ] ECS Cluster created
- [ ] Task Definition created
- [ ] Application Load Balancer created
- [ ] Target Group created
- [ ] ECS Service created
- [ ] Auto-scaling configured
- [ ] Secrets Manager setup
- [ ] CloudWatch Logs configured
- [ ] CloudWatch Alarms setup
- [ ] CI/CD pipeline configured
- [ ] Health checks working
- [ ] Load testing completed

---

## 📞 9. TROUBLESHOOTING

### Common Issues

1. **Service not starting**:
   - Check CloudWatch Logs
   - Verify task definition
   - Check security groups

2. **High CPU/Memory**:
   - Increase task CPU/Memory
   - Optimize application code
   - Check auto-scaling

3. **Health check failures**:
   - Verify health endpoint
   - Check security groups
   - Verify target group configuration

---

## 📚 10. RESOURCES

- AWS ECS Documentation: https://docs.aws.amazon.com/ecs/
- AWS ECS Best Practices: https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/
- AWS Fargate: https://aws.amazon.com/fargate/
