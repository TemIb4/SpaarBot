# 🚀 SpaarBot Production Deployment Guide

Complete guide for deploying SpaarBot to production with PostgreSQL, Redis, and monitoring.

---

## 📋 Prerequisites

- Docker & Docker Compose installed
- Domain name with SSL certificate
- Minimum 2GB RAM, 2 CPU cores
- 20GB storage

---

## 🗄️ Database Migration: SQLite → PostgreSQL

### Step 1: Backup Current Database

```bash
# Create backup directory
mkdir -p backup

# Export SQLite data
sqlite3 data/spaarbot.db .dump > backup/sqlite_dump.sql
```

### Step 2: Setup PostgreSQL

```bash
# Copy production config
cp .env.production.example .env.production

# Edit with your values
nano .env.production

# Start PostgreSQL
docker-compose up -d postgres
```

### Step 3: Create Tables in PostgreSQL

```bash
# Run migrations (Alembic)
cd backend
alembic upgrade head
```

### Step 4: Migrate Data (if needed)

```bash
# Python script to migrate data
python scripts/migrate_sqlite_to_postgres.py
```

---

## 🐳 Docker Deployment

### Quick Start

```bash
# 1. Configure environment
cp .env.production.example .env.production
nano .env.production

# 2. Start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f backend

# 4. Verify health
curl http://localhost:8000/health
```

### Service URLs

- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 🔧 Configuration

### Database URLs

**Development (SQLite):**
```bash
DATABASE_URL=sqlite+aiosqlite:///./data/spaarbot.db
```

**Production (PostgreSQL):**
```bash
DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/spaarbot_prod
```

### Redis

```bash
REDIS_URL=redis://:password@redis:6379/0
```

### Security

**Generate Strong Secrets:**
```bash
# Secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Database password
openssl rand -base64 32

# Redis password
openssl rand -base64 24
```

---

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# PostgreSQL
docker exec spaarbot_postgres pg_isready

# Redis
docker exec spaarbot_redis redis-cli ping
```

### Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

---

## 🔐 Security Hardening

### 1. Firewall Rules

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 2. SSL/TLS

Use Let's Encrypt with Nginx:

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d your-domain.com
```

### 3. Database Security

```sql
-- Create read-only user for backups
CREATE USER spaarbot_readonly WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE spaarbot_prod TO spaarbot_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO spaarbot_readonly;
```

---

## 💾 Backup & Restore

### Automated Backups

```bash
# Add to crontab
0 2 * * * /app/scripts/backup.sh

# Backup script
#!/bin/bash
BACKUP_DIR=/backup
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL dump
docker exec spaarbot_postgres pg_dump -U spaarbot spaarbot_prod | \
  gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "postgres_*.sql.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
# Restore PostgreSQL
gunzip < backup/postgres_20240102_120000.sql.gz | \
  docker exec -i spaarbot_postgres psql -U spaarbot spaarbot_prod
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose build

# Restart services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head
```

### Database Maintenance

```bash
# Vacuum and analyze
docker exec spaarbot_postgres psql -U spaarbot -d spaarbot_prod -c "VACUUM ANALYZE;"

# Check database size
docker exec spaarbot_postgres psql -U spaarbot -c "SELECT pg_size_pretty(pg_database_size('spaarbot_prod'));"
```

---

## 📈 Performance Tuning

### PostgreSQL

Edit `postgresql.conf`:

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connections
max_connections = 100

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Redis

```bash
# maxmemory policy
docker exec spaarbot_redis redis-cli CONFIG SET maxmemory 256mb
docker exec spaarbot_redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait for healthcheck
# 2. Environment variables missing
# 3. Port 8000 already in use
```

### Database connection issues

```bash
# Test connection
docker exec spaarbot_postgres psql -U spaarbot -d spaarbot_prod -c "SELECT version();"

# Check environment
docker-compose exec backend env | grep DATABASE_URL
```

### Out of memory

```bash
# Check memory usage
docker stats

# Increase limits in docker-compose.yml
services:
  backend:
    mem_limit: 1g
    memswap_limit: 2g
```

---

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/TemIb4/SpaarBot/issues
- Documentation: See README.md

---

## ✅ Production Checklist

Before going live:

- [ ] Changed all default passwords
- [ ] Configured CORS origins
- [ ] SSL certificate installed
- [ ] Automated backups configured
- [ ] Monitoring enabled
- [ ] Rate limiting active
- [ ] Firewall rules set
- [ ] Domain DNS configured
- [ ] Telegram webhook set
- [ ] Error logging configured
- [ ] Health checks passing
- [ ] Load testing completed

---

**Last updated:** 2026-01-02
