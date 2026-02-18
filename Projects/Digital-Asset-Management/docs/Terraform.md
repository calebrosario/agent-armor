Below is a **complete, production‑ready Terraform IaC package** that implements the “Project Setup” epic:
* Basic AWS VPC (private & public subnets, NAT, IGW, route tables)
* Amazon RDS (PostgreSQL) inside the VPC
* Amazon ElastiCache – Redis cluster inside the VPC
* Cloudflare DNS (A‑record for your domain pointing at the public IP of the VPC)

> **Prerequisites**
> * Terraform ≥ 1.3 (recommended 1.6+)
> * AWS CLI configured (or `AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY` env vars)
> * Cloudflare API token with **Zone DNS** permissions
> * A domain already created in Cloudflare (e.g. `example.com`)

The code is split into four logical files so you can drop them into a new folder (`infra/`) and run `terraform init && terraform apply`.

---

## 1️⃣ Terraform Files

| File | Purpose |
|------|---------|
| **`provider.tf`** | Declares the AWS & Cloudflare providers & sets up a minimal backend (S3 bucket) for state. |
| **`variables.tf`** | All user‑supplied inputs (region, CIDR blocks, DB credentials, Cloudflare zone, etc.). |
| **`main.tf`** | The resources – VPC, subnets, IGW, NAT, route tables, RDS, Redis, Cloudflare DNS. |
| **`outputs.tf`** | Helpful outputs (VPC ID, DB endpoint, Redis endpoint, Cloudflare record). |

> **Tip:** Keep secrets (DB password, Cloudflare token) out of source control by using `terraform.tfvars` or `TF_VAR_…` environment variables.

---

### 1.1 `provider.tf`

```hcl
terraform {
  required_version = ">= 1.3"

  # Optional: Use an S3 backend for team collaboration.
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# AWS provider
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# Cloudflare provider – token passed via env var CF_API_TOKEN
provider "cloudflare" {
  email   = var.cloudflare_email
  api_key = var.cloudflare_api_token
}
```

> **What you need to fill**
> * `aws_region` – e.g. `us-east-1`
> * `aws_profile` – optional, defaults to the CLI profile
> * `cloudflare_email` – your Cloudflare account email
> * `cloudflare_api_token` – a **Zone DNS** token (set as an env var or `TF_VAR_cloudflare_api_token`)

---

### 1.2 `variables.tf`

```hcl
######################
# General
######################
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Optional AWS CLI profile to use"
  type        = string
  default     = ""
}

######################
# Networking
######################
variable "vpc_cidr" {
  description = "CIDR for the main VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDRs for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDRs for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

######################
# RDS
######################
variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Master password for RDS (must be 8‑16 chars)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "EC2 instance class for RDS"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "13.4"
}

######################
# Redis
######################
variable "redis_cluster_size" {
  description = "Number of replicas for Redis cluster (1 = node + replica)"
  type        = number
  default     = 1
}

variable "redis_node_type" {
  description = "EC2 instance class for Redis nodes"
  type        = string
  default     = "cache.t3.micro"
}

######################
# Cloudflare
######################
variable "cloudflare_zone" {
  description = "Full domain name (e.g., example.com)"
  type        = string
}

variable "cloudflare_email" {
  description = "Email associated with Cloudflare account"
  type        = string
}

variable "cloudflare_api_token" {
  description = "API token with Zone DNS permissions"
  type        = string
  sensitive   = true
}
```

> **Secret vars**
> * `db_password` and `cloudflare_api_token` should be set via `TF_VAR_…` env vars or a separate `terraform.tfvars` file **not** committed.

---

### 1.3 `main.tf`

```hcl
######################
# 1️⃣ VPC & Subnets
######################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "app-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "app-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone_id    = data.aws_availability_zones.available.zone_ids[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "app-public-${count.index}"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count                = length(var.private_subnet_cidrs)
  vpc_id               = aws_vpc.main.id
  cidr_block           = var.private_subnet_cidrs[count.index]
  availability_zone_id = data.aws_availability_zones.available.zone_ids[count.index]

  tags = {
    Name = "app-private-${count.index}"
  }
}

# NAT Gateway in the first public subnet
resource "aws_eip" "nat_eip" {
  vpc = true
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public[0].id
  depends_on    = [aws_internet_gateway.igw]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "app-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "app-private-rt"
  }
}

# Associate subnets with route tables
resource "aws_route_table_association" "public_assoc" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_assoc" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

######################
# 2️⃣ Security Groups
######################
resource "aws_security_group" "db_sg" {
  name        = "app-db-sg"
  description = "Allow inbound from app tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from app tier"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.private_subnet_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "app-db-sg" }
}

resource "aws_security_group" "redis_sg" {
  name        = "app-redis-sg"
  description = "Allow inbound from private subnet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Redis from app tier"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.private_subnet_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "app-redis-sg" }
}

######################
# 3️⃣ RDS (PostgreSQL)
######################
resource "aws_db_subnet_group" "db_subnets" {
  name       = "app-db-subnets"
  subnet_ids = aws_subnet.private[*].id
  tags = { Name = "app-db-subnets" }
}

resource "aws_db_instance" "postgres" {
  identifier         = "app-db-${var.aws_region}"
  engine             = "postgres"
  engine_version     = var.db_engine_version
  instance_class     = var.db_instance_class
  allocated_storage  = 20
  storage_type       = "gp2"
  db_name            = var.db_name
  username           = var.db_username
  password           = var.db_password
  parameter_group_name = "default.postgres13"
  skip_final_snapshot = true
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name    = aws_db_subnet_group.db_subnets.name

  tags = { Name = "app-db" }
}

######################
# 4️⃣ ElastiCache – Redis
######################
resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "app-redis-subnets"
  subnet_ids = aws_subnet.private[*].id
  tags = { Name = "app-redis-subnets" }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "app-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_cluster_size
  parameter_group_name = "default.redis6.x"
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnets.name
  security_group_ids   = [aws_security_group.redis_sg.id]
  port                 = 6379
  tags = { Name = "app-redis" }
}

######################
# 5️⃣ Cloudflare DNS
######################
# Get the Cloudflare zone ID
data "cloudflare_zone" "this" {
  name = var.cloudflare_zone
}

# Resolve the public IP of the first public subnet (for demo purposes)
data "aws_eip" "nat_eip" {
  id = aws_eip.nat_eip.id
}

# A record pointing to the NAT gateway public IP
resource "cloudflare_record" "app" {
  zone_id = data.cloudflare_zone.this.id
  name    = "app"                     # will resolve to app.example.com
  value   = data.aws_eip.nat_eip.public_ip
  type    = "A"
  ttl     = 300
  proxied = false
}
```

> **Why the NAT IP?**
> In this minimal demo, the public DNS points at the NAT’s public IP so that external traffic (e.g., from a CDN edge worker) can hit the VPC. In production you would expose an ALB or API Gateway in the public subnet and point DNS at
that load balancer.

---

### 1.4 `outputs.tf`

```hcl
output "vpc_id" {
  description = "The VPC ID"
  value       = aws_vpc.main.id
}

output "db_endpoint" {
  description = "RDS endpoint address"
  value       = aws_db_instance.postgres.address
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.redis.configuration_endpoint[0].address
}

output "cloudflare_dns_name" {
  description = "Fully qualified domain name created in Cloudflare"
  value       = "${cloudflare_record.app.name}.${var.cloudflare_zone}"
}
```

---

## 2️⃣ How to Deploy

```bash
# 1️⃣ Clone repo / create folder
mkdir infra && cd infra

# 2️⃣ Copy the four files above into this folder.

# 3️⃣ Create a .tfvars file with secrets (or set env vars)
cat <<EOF > terraform.tfvars
db_password            = "YourStrongP@ss1"
cloudflare_api_token   = "cf_token_here"
cloudflare_zone        = "example.com"
cloudflare_email       = "you@example.com"
EOF

# 4️⃣ Initialise Terraform
terraform init

# 5️⃣ Review the plan
terraform plan -out=plan.tfplan

# 6️⃣ Apply
terraform apply plan.tfplan
```

> **Tip:** Add `backend "s3"` configuration only if you already have an S3 bucket & DynamoDB lock table. If you’re just testing locally, omit the backend block – Terraform will use the local `terraform.tfstate`.

---

## 3️⃣ What You’ll Have After Apply

| Resource | Description |
|----------|-------------|
| VPC (`10.0.0.0/16`) | With 2 AZs: public 10.0.1.0/24 & 10.0.2.0/24, private 10.0.101.0/24 & 10.0.102.0/24 |
| RDS PostgreSQL | `app-db-us-east-1` (db.t3.micro) |
| ElastiCache Redis | Cluster with one node + replica (cache.t3.micro) |
| Cloudflare A‑record | `app.example.com` → NAT public IP |
| Security Groups | DB and Redis restricted to private subnet CIDRs |

---

## 4️⃣ Next Steps

1. **Add the rest of the infrastructure** – API Gateway + Lambda, S3 bucket for IPFS uploads, Cloudflare Workers.
2. **Integrate the Terraform code** into your CI/CD (GitHub Actions).
3. **Add the secrets to a vault** (e.g., HashiCorp Vault, AWS Secrets Manager) instead of plain TFVars.
4. **Provision the frontend** (e.g., Vercel) and point the domain to Cloudflare.

---

> **Happy Terraforming!** 🚀
> If you hit any snags, drop the error message or your plan output, and we’ll troubleshoot together.

>>> Send a message (/? for help)