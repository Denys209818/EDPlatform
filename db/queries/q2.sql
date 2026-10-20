SELECT id, title, created_at
FROM tblTests
WHERE status = 'archived'
ORDER BY created_at DESC
LIMIT 50