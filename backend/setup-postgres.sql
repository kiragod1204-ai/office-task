-- PostgreSQL setup script for AI Code Agent Backend
-- Run this script to create the database and user

-- Create database
CREATE DATABASE ai_code_agent;

-- Create user with password
CREATE USER dev_user WITH PASSWORD 'dev_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_code_agent TO dev_user;

-- Connect to the database
\c ai_code_agent;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;