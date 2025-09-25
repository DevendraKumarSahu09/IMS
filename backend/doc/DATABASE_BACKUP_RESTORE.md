# MongoDB Backup and Restore Documentation

This document provides instructions for backing up and restoring the Insurance Management System database.

## Prerequisites

- MongoDB installed locally or access to MongoDB Atlas
- `mongodump` and `mongorestore` utilities (included with MongoDB installation)
- Access to the database with appropriate permissions

## Environment Setup

### Local MongoDB
```bash
# Default connection string for local MongoDB
MONGO_URI=mongodb://localhost:27017/insurance_management
```

### MongoDB Atlas
```bash
# Connection string for MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/insurance_management
```

## Backup Procedures

### 1. Full Database Backup

#### Local MongoDB
```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# Backup entire database
mongodump --uri="mongodb://localhost:27017/insurance_management" \
  --out="backups/$(date +%Y%m%d_%H%M%S)"

# Compress backup
tar -czf "backups/insurance_management_$(date +%Y%m%d_%H%M%S).tar.gz" \
  "backups/$(date +%Y%m%d_%H%M%S)"
```

#### MongoDB Atlas
```bash
# For MongoDB Atlas, use the connection string with credentials
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/insurance_management" \
  --out="backups/$(date +%Y%m%d_%H%M%S)"
```

### 2. Specific Collection Backup

```bash
# Backup specific collections
mongodump --uri="mongodb://localhost:27017/insurance_management" \
  --collection=users \
  --collection=policies \
  --collection=userpolicies \
  --out="backups/$(date +%Y%m%d_%H%M%S)_collections"
```

### 3. Automated Backup Script

Create a backup script for regular automated backups:

```bash
#!/bin/bash
# backup_script.sh

DB_NAME="insurance_management"
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Perform backup
mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH"

# Compress backup
tar -czf "$BACKUP_DIR/insurance_management_$DATE.tar.gz" "$BACKUP_PATH"

# Remove uncompressed backup
rm -rf "$BACKUP_PATH"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "insurance_management_*.tar.gz" -mtime +7 -delete

echo "Backup completed: insurance_management_$DATE.tar.gz"
```

Make the script executable:
```bash
chmod +x backup_script.sh
```

## Restore Procedures

### 1. Full Database Restore

#### From Compressed Backup
```bash
# Extract backup
tar -xzf backups/insurance_management_20240101_120000.tar.gz

# Restore database
mongorestore --uri="mongodb://localhost:27017/insurance_management" \
  --drop \
  backups/20240101_120000/insurance_management/
```

#### From Uncompressed Backup
```bash
mongorestore --uri="mongodb://localhost:27017/insurance_management" \
  --drop \
  backups/20240101_120000/insurance_management/
```

### 2. Specific Collection Restore

```bash
# Restore specific collections
mongorestore --uri="mongodb://localhost:27017/insurance_management" \
  --collection=users \
  --collection=policies \
  backups/20240101_120000/insurance_management/
```

### 3. Restore to Different Database

```bash
# Restore to a different database name
mongorestore --uri="mongodb://localhost:27017/insurance_management_restored" \
  --drop \
  backups/20240101_120000/insurance_management/
```

## Verification

### 1. Verify Backup
```bash
# List backup contents
ls -la backups/20240101_120000/insurance_management/

# Check collection counts
mongosh --eval "
  use insurance_management;
  db.users.countDocuments();
  db.policies.countDocuments();
  db.userpolicies.countDocuments();
  db.claims.countDocuments();
  db.payments.countDocuments();
  db.auditlogs.countDocuments();
"
```

### 2. Verify Restore
```bash
# Connect to restored database and verify data
mongosh "mongodb://localhost:27017/insurance_management"

# In MongoDB shell:
use insurance_management;
show collections;
db.users.find().limit(5);
db.policies.find().limit(5);
```

## Best Practices

### 1. Regular Backup Schedule
- **Daily backups** for production environments
- **Weekly backups** for development environments
- **Before major deployments** or schema changes

### 2. Backup Storage
- Store backups in **multiple locations** (local, cloud, offsite)
- Use **encryption** for sensitive data backups
- Implement **retention policies** (keep 30-90 days of backups)

### 3. Testing
- **Regularly test restore procedures**
- Verify backup integrity
- Document any issues or special procedures

### 4. Monitoring
- Monitor backup success/failure
- Set up alerts for backup failures
- Track backup sizes and storage usage

## Troubleshooting

### Common Issues

#### 1. Connection Timeout
```bash
# Increase timeout for large databases
mongodump --uri="$MONGO_URI" --numParallelCollections=1 --out="$BACKUP_PATH"
```

#### 2. Authentication Issues
```bash
# Use authentication parameters
mongodump --uri="$MONGO_URI" --authenticationDatabase=admin --out="$BACKUP_PATH"
```

#### 3. Insufficient Disk Space
```bash
# Check available space
df -h

# Use compression during backup
mongodump --uri="$MONGO_URI" --gzip --out="$BACKUP_PATH"
```

#### 4. Large Database Backup
```bash
# For very large databases, use parallel collections
mongodump --uri="$MONGO_URI" --numParallelCollections=4 --out="$BACKUP_PATH"
```

## Emergency Procedures

### 1. Point-in-Time Recovery
For MongoDB Atlas, use the built-in point-in-time recovery feature.

### 2. Partial Data Recovery
```bash
# Restore only specific collections
mongorestore --uri="$MONGO_URI" \
  --collection=users \
  --collection=policies \
  backups/20240101_120000/insurance_management/
```

### 3. Data Migration
```bash
# Export data to JSON for migration
mongoexport --uri="$MONGO_URI" --collection=users --out=users.json
mongoexport --uri="$MONGO_URI" --collection=policies --out=policies.json

# Import data from JSON
mongoimport --uri="$MONGO_URI" --collection=users --file=users.json
mongoimport --uri="$MONGO_URI" --collection=policies --file=policies.json
```

## Security Considerations

1. **Encrypt backups** containing sensitive data
2. **Secure backup storage** with proper access controls
3. **Use strong authentication** for database connections
4. **Regular security audits** of backup procedures
5. **Document access permissions** for backup/restore operations

## Contact Information

For backup/restore issues or questions:
- **Database Administrator**: [Contact Info]
- **System Administrator**: [Contact Info]
- **Emergency Contact**: [Contact Info]

---

**Last Updated**: January 2025
**Version**: 1.0
