-- Create task_outgoing_documents table for proper task-outgoing document relationships
CREATE TABLE IF NOT EXISTS task_outgoing_documents (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    outgoing_document_id INTEGER NOT NULL REFERENCES outgoing_documents(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'result',
    notes TEXT,
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_outgoing_documents_task_id ON task_outgoing_documents(task_id);
CREATE INDEX IF NOT EXISTS idx_task_outgoing_documents_outgoing_document_id ON task_outgoing_documents(outgoing_document_id);
CREATE INDEX IF NOT EXISTS idx_task_outgoing_documents_created_by_id ON task_outgoing_documents(created_by_id);
CREATE INDEX IF NOT EXISTS idx_task_outgoing_documents_relationship_type ON task_outgoing_documents(relationship_type);
CREATE INDEX IF NOT EXISTS idx_task_outgoing_documents_deleted_at ON task_outgoing_documents(deleted_at);

-- Create unique constraint to prevent duplicate relationships
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_outgoing_documents_unique 
ON task_outgoing_documents(task_id, outgoing_document_id, deleted_at);
