SELECT id, title, status, created_at
FROM tblTests
WHERE created_by = (SELECT created_by FROM tblTests LIMIT 1)
  AND created_at >= now() - interval '180 days'
ORDER BY created_at DESC
LIMIT 50