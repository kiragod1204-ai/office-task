-- Enhanced Database Schema Migration
-- This migration enhances the existing schema to support the comprehensive document management system

-- Add new columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id);

-- Create Document Types table
CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create Issuing Units table
CREATE TABLE IF NOT EXISTS issuing_units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create Receiving Units table
CREATE TABLE IF NOT EXISTS receiving_units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create Incoming Documents table
CREATE TABLE IF NOT EXISTS incoming_documents (
    id SERIAL PRIMARY KEY,
    arrival_date DATE NOT NULL,
    arrival_number INTEGER UNIQUE NOT NULL,
    original_number VARCHAR(255) NOT NULL,
    document_date DATE NOT NULL,
    document_type_id INTEGER NOT NULL REFERENCES document_types(id),
    issuing_unit_id INTEGER NOT NULL REFERENCES issuing_units(id),
    summary TEXT NOT NULL,
    internal_notes TEXT,
    processor_id INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    file_path VARCHAR(500),
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create Outgoing Documents table
CREATE TABLE IF NOT EXISTS outgoing_documents (
    id SERIAL PRIMARY KEY,
    document_number VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    document_type_id INTEGER NOT NULL REFERENCES document_types(id),
    issuing_unit_id INTEGER NOT NULL REFERENCES issuing_units(id),
    summary TEXT NOT NULL,
    drafter_id INTEGER NOT NULL REFERENCES users(id),
    approver_id INTEGER NOT NULL REFERENCES users(id),
    internal_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    file_path VARCHAR(500),
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create System Notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create Task Status History table
CREATE TABLE IF NOT EXISTS task_status_histories (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_id INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Update existing tasks table with new columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS incoming_document_id INTEGER REFERENCES incoming_documents(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'document_linked';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline_type VARCHAR(50) DEFAULT 'specific';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS processing_content TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS processing_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP;

-- Rename columns in tasks table to match new naming convention (if they exist)
DO $$
BEGIN
    -- Check and rename assigned_to to assigned_to_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
        ALTER TABLE tasks RENAME COLUMN assigned_to TO assigned_to_id;
    END IF;
    
    -- Check and rename created_by to created_by_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
        ALTER TABLE tasks RENAME COLUMN created_by TO created_by_id;
    END IF;
END $$;

-- Make deadline nullable in tasks table
ALTER TABLE tasks ALTER COLUMN deadline DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incoming_documents_arrival_number ON incoming_documents(arrival_number);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_status ON incoming_documents(status);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_processor_id ON incoming_documents(processor_id);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_created_by_id ON incoming_documents(created_by_id);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_document_type_id ON incoming_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_issuing_unit_id ON incoming_documents(issuing_unit_id);

CREATE INDEX IF NOT EXISTS idx_outgoing_documents_status ON outgoing_documents(status);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_drafter_id ON outgoing_documents(drafter_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_approver_id ON outgoing_documents(approver_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_created_by_id ON outgoing_documents(created_by_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_document_type_id ON outgoing_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_issuing_unit_id ON outgoing_documents(issuing_unit_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_id ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_incoming_document_id ON tasks(incoming_document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

CREATE INDEX IF NOT EXISTS idx_task_status_histories_task_id ON task_status_histories(task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_histories_changed_by_id ON task_status_histories(changed_by_id);

CREATE INDEX IF NOT EXISTS idx_system_notifications_is_active ON system_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_by_id ON system_notifications(created_by_id);

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_by_id ON users(created_by_id);

-- Insert default document types
INSERT INTO document_types (name, description) VALUES 
    ('Thông báo', 'Văn bản thông báo thông tin'),
    ('Công văn', 'Công văn hành chính'),
    ('Quyết định', 'Quyết định của cơ quan có thẩm quyền'),
    ('Chỉ thị', 'Chỉ thị điều hành công việc'),
    ('Báo cáo', 'Báo cáo tình hình công việc'),
    ('Tờ trình', 'Tờ trình đề xuất giải pháp')
ON CONFLICT (name) DO NOTHING;

-- Insert default issuing units
INSERT INTO issuing_units (name, description) VALUES 
    ('UBND Tỉnh', 'Ủy ban nhân dân tỉnh'),
    ('Công an Tỉnh', 'Công an tỉnh'),
    ('UBND Huyện', 'Ủy ban nhân dân huyện'),
    ('Công an Huyện', 'Công an huyện'),
    ('UBND Xã', 'Ủy ban nhân dân xã'),
    ('Các cơ quan khác', 'Các cơ quan, đơn vị khác')
ON CONFLICT (name) DO NOTHING;

-- Insert default receiving units
INSERT INTO receiving_units (name, description) VALUES 
    ('UBND Tỉnh', 'Ủy ban nhân dân tỉnh'),
    ('Công an Tỉnh', 'Công an tỉnh'),
    ('UBND Huyện', 'Ủy ban nhân dân huyện'),
    ('Công an Huyện', 'Công an huyện'),
    ('UBND Xã', 'Ủy ban nhân dân xã'),
    ('Các cơ quan khác', 'Các cơ quan, đơn vị khác')
ON CONFLICT (name) DO NOTHING;

-- Clean up old incoming_files table if it exists (no longer needed)
-- Files are now stored directly in document records
DROP TABLE IF EXISTS incoming_files;

-- Add sequence for auto-incrementing arrival numbers
CREATE SEQUENCE IF NOT EXISTS arrival_number_seq START 1;

-- Create function to get next arrival number for the current year
CREATE OR REPLACE FUNCTION get_next_arrival_number() RETURNS INTEGER AS $$
DECLARE
    current_year INTEGER;
    max_number INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT COALESCE(MAX(arrival_number), 0) INTO max_number
    FROM incoming_documents 
    WHERE EXTRACT(YEAR FROM arrival_date) = current_year;
    
    RETURN max_number + 1;
END;
$$ LANGUAGE plpgsql;