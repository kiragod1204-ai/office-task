-- Database setup script for PostgreSQL
-- This script creates the database and user if they don't exist

-- Connect to postgres database first
\c postgres;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE docments'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'docments')\gexec

-- Create user if it doesn't exist (optional)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'docments_user') THEN

      CREATE ROLE docments_user LOGIN PASSWORD 'docments_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE docments TO docments_user;

-- Connect to the docments database
\c docments;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO docments_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO docments_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO docments_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO docments_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO docments_user;