# Database Setup Guide

## Automatic Setup (Recommended)

The application now automatically creates the database if it doesn't exist. Simply run:

```bash
go run main.go
```

The application will:
1. Check if the database exists
2. Create it if it doesn't exist
3. Run migrations and seed data
4. Start the server

## Manual Setup (Alternative)

If you prefer to set up the database manually:

### 1. Start PostgreSQL

Make sure PostgreSQL is running on your system. The default configuration expects:
- Host: localhost
- Port: 5430
- User: postgres
- Password: password

### 2. Create Database Manually

```bash
# Connect to PostgreSQL
psql -h localhost -p 5430 -U postgres

# Create database
CREATE DATABASE docments;

# Exit psql
\q
```

### 3. Run Setup Script (Optional)

```bash
psql -h localhost -p 5430 -U postgres -f scripts/setup-db.sql
```

## Environment Variables

You can customize database settings using environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=5430
export DB_USER=postgres
export DB_PASSWORD=password
export DB_NAME=docments
```

Or create a `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_PORT=5430
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=docments
```

## Docker Setup (Alternative)

If you want to run PostgreSQL in Docker:

```bash
docker run --name postgres-docments \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=docments \
  -p 5430:5432 \
  -d postgres:13
```

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # On Linux/Mac
   sudo systemctl status postgresql
   
   # On Windows
   net start postgresql-x64-13
   ```

2. **Check port availability:**
   ```bash
   netstat -an | grep 5430
   ```

3. **Test connection:**
   ```bash
   psql -h localhost -p 5430 -U postgres -c "SELECT version();"
   ```

### Permission Issues

If you get permission errors, make sure the PostgreSQL user has the necessary privileges:

```sql
-- Connect as superuser
psql -h localhost -p 5430 -U postgres

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE docments TO postgres;
```

### Database Already Exists Error

If you get "database already exists" error, it's safe to ignore. The application will use the existing database.

## Default Data

The application automatically creates:
- Default users (admin, secretary, team leader, etc.)
- Sample document types
- Sample issuing/receiving units
- Sample documents and tasks

Default login credentials:
- Admin: admin / admin123
- Secretary: secretary / secretary123
- Team Leader: teamleader / team123
- Deputy: deputy / deputy123
- Officer: officer / officer123