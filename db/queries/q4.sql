SELECT id, title, ts_rank(search_vector, plainto_tsquery('simple', 'квадратні рівняння')) AS rank
FROM tblTests
WHERE search_vector @@ plainto_tsquery('simple', 'квадратні рівняння')
ORDER BY rank DESC, id
LIMIT 20