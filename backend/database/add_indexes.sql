-- Add indexes for improved filtering and search performance

-- Incoming Documents indexes
CREATE INDEX IF NOT EXISTS idx_incoming_documents_arrival_date ON incoming_documents(arrival_date);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_document_date ON incoming_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_status ON incoming_documents(status);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_document_type_id ON incoming_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_issuing_unit_id ON incoming_documents(issuing_unit_id);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_processor_id ON incoming_documents(processor_id);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_created_by_id ON incoming_documents(created_by_id);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_original_number ON incoming_documents(original_number);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_summary_gin ON incoming_documents USING gin(to_tsvector('english', summary));

-- Outgoing Documents indexes
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_issue_date ON outgoing_documents(issue_date);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_status ON outgoing_documents(status);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_document_type_id ON outgoing_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_issuing_unit_id ON outgoing_documents(issuing_unit_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_drafter_id ON outgoing_documents(drafter_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_approver_id ON outgoing_documents(approver_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_created_by_id ON outgoing_documents(created_by_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_document_number ON outgoing_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_summary_gin ON outgoing_documents USING gin(to_tsvector('english', summary));

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_id ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_type ON tasks(deadline_type);
CREATE INDEX IF NOT EXISTS idx_tasks_incoming_document_id ON tasks(incoming_document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completion_date ON tasks(completion_date);
CREATE INDEX IF NOT EXISTS idx_tasks_description_gin ON tasks USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_tasks_processing_content_gin ON tasks USING gin(to_tsvector('english', processing_content));

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_incoming_documents_status_date ON incoming_documents(status, arrival_date);
CREATE INDEX IF NOT EXISTS idx_incoming_documents_processor_status ON incoming_documents(processor_id, status);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_status_date ON outgoing_documents(status, issue_date);
CREATE INDEX IF NOT EXISTS idx_outgoing_documents_drafter_status ON outgoing_documents(drafter_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assigned_to_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_status ON tasks(deadline, status);

-- Users indexes for role-based filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- Document Types and Units indexes
CREATE INDEX IF NOT EXISTS idx_document_types_is_active ON document_types(is_active);
CREATE INDEX IF NOT EXISTS idx_issuing_units_is_active ON issuing_units(is_active);
CREATE INDEX IF NOT EXISTS idx_receiving_units_is_active ON receiving_units(is_active);

-- Task Status History indexes
CREATE INDEX IF NOT EXISTS idx_task_status_histories_task_id ON task_status_histories(task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_histories_changed_by_id ON task_status_histories(changed_by_id);
CREATE INDEX IF NOT EXISTS idx_task_status_histories_created_at ON task_status_histories(created_at);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);