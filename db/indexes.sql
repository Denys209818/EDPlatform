CREATE INDEX idx_tbltests_created_by_created_at ON tblTests (created_by, created_at DESC);

CREATE INDEX idx_tbltests_archived_created_at ON tblTests (created_at DESC) WHERE status = 'archived';

CREATE INDEX idx_tblusers_lower_email ON tblUsers (lower(email));

CREATE INDEX idx_tbltests_search_vector ON tblTests USING GIN (search_vector);
