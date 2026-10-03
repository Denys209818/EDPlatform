# Оптимізація запитів

Дані: tblTests — 110 000 рядків (published 76 946 / draft 22 118 / archived 10 936), tblUsers — 10 000 рядків.
Виміряно на чистому volume: schema.sql → seed.sql → EXPLAIN "до" → indexes.sql → ANALYZE → EXPLAIN "після".

## q1 — пошук тестів власника за період

sql
SELECT id, title, status, created_at
FROM tblTests
WHERE created_by = (SELECT created_by FROM tblTests LIMIT 1)
AND created_at >= now() - interval '180 days'
ORDER BY created_at DESC
LIMIT 50

### До індексів

Limit (cost=16492.84..16493.08 rows=2 width=125) (actual time=23.551..25.946 rows=4 loops=1)
Buffers: shared hit=14652
InitPlan 1
-> Limit (cost=0.00..0.14 rows=1 width=16) (actual time=0.012..0.013 rows=1 loops=1)
Buffers: shared hit=2
-> Seq Scan on tbltests tbltests_1 (cost=0.00..15676.00 rows=110000 width=16) (actual time=0.012..0.012 rows=1 loops=1)
Buffers: shared hit=2
-> Gather Merge (cost=16492.70..16492.94 rows=2 width=125) (actual time=23.550..25.944 rows=4 loops=1)
Workers Planned: 2
Workers Launched: 2
Buffers: shared hit=14652
-> Sort (cost=15492.68..15492.68 rows=1 width=125) (actual time=17.957..17.957 rows=1 loops=3)
Sort Key: tbltests.created_at DESC
Sort Method: quicksort Memory: 25kB
Buffers: shared hit=14650
-> Parallel Seq Scan on tbltests (cost=0.00..15492.67 rows=1 width=125) (actual time=6.406..17.794 rows=1 loops=3)
Filter: ((created_by = (InitPlan 1).col1) AND (created_at >= (now() - '180 days'::interval)))
Rows Removed by Filter: 36665
Buffers: shared hit=14576
Planning Time: 0.438 ms
Execution Time: 25.995 ms

### Після індексів

Limit (cost=0.57..16.62 rows=3 width=125) (actual time=0.113..0.183 rows=4 loops=1)
Buffers: shared hit=4 read=4
InitPlan 1
-> Limit (cost=0.00..0.14 rows=1 width=16) (actual time=0.032..0.033 rows=1 loops=1)
Buffers: shared read=1
-> Seq Scan on tbltests tbltests_1 (cost=0.00..15676.00 rows=110000 width=16) (actual time=0.032..0.032 rows=1 loops=1)
Buffers: shared read=1
-> Index Scan using idx_tbltests_created_by_created_at on tbltests (cost=0.42..16.48 rows=3 width=125) (actual time=0.113..0.182 rows=4 loops=1)
Index Cond: ((created_by = (InitPlan 1).col1) AND (created_at >= (now() - '180 days'::interval)))
Buffers: shared hit=4 read=4
Planning Time: 0.795 ms
Execution Time: 0.245 ms

idx_tbltests_created_by_created_at (composite btree на (created_by, created_at DESC)) замінив Parallel Seq Scan + Sort на прямий Index Scan, що вже повертає рядки в потрібному порядку — buffers впали з 14652 до 8, час з 25.995 мс до 0.245 мс (~106×).

## q2 — фільтр тестів по статусу

sql
SELECT id, title, created_at
FROM tblTests
WHERE status = 'archived'
ORDER BY created_at DESC
LIMIT 50

### До індексів

Limit (cost=16309.70..16309.83 rows=50 width=116) (actual time=25.842..25.849 rows=50 loops=1)
Buffers: shared hit=14579
-> Sort (cost=16309.70..16336.70 rows=10798 width=116) (actual time=25.841..25.846 rows=50 loops=1)
Sort Key: created_at DESC
Sort Method: top-N heapsort Memory: 42kB
Buffers: shared hit=14579
-> Seq Scan on tbltests (cost=0.00..15951.00 rows=10798 width=116) (actual time=0.008..24.951 rows=10936 loops=1)
Filter: (status = 'archived'::text)
Rows Removed by Filter: 99064
Buffers: shared hit=14576
Planning Time: 0.255 ms
Execution Time: 25.904 ms

### Після індексів

Limit (cost=0.29..147.02 rows=50 width=116) (actual time=0.098..0.887 rows=50 loops=1)
Buffers: shared hit=43 read=9
-> Index Scan using idx_tbltests_archived_created_at on tbltests (cost=0.29..32140.03 rows=10952 width=116) (actual time=0.097..0.883 rows=50 loops=1)
Buffers: shared hit=43 read=9
Planning Time: 0.399 ms
Execution Time: 0.914 ms

idx_tbltests_archived_created_at — **partial** btree на (created_at DESC) WHERE status = 'archived' — містить лише ~10% рядків (архівні), тому Sort і Seq Scan зникли повністю: план одразу віддає відсортовані рядки через Index Scan, buffers впали з 14579 до 52, час з 25.904 мс до 0.914 мс (~28×).

## q3 — пошук користувача по email без урахування регістру

sql
SELECT id, first_name, last_name, email
FROM tblUsers
WHERE lower(email) = lower('User5000@Example.com')

### До індексів

Seq Scan on tblusers (cost=0.00..400.00 rows=50 width=64) (actual time=0.814..1.689 rows=1 loops=1)
Filter: (lower((email)::text) = 'user5000@example.com'::text)
Rows Removed by Filter: 9999
Buffers: shared hit=250
Planning Time: 0.277 ms
Execution Time: 1.702 ms

### Після індексів

Index Scan using idx_tblusers_lower_email on tblusers (cost=0.29..8.30 rows=1 width=64) (actual time=0.032..0.032 rows=1 loops=1)
Index Cond: (lower((email)::text) = 'user5000@example.com'::text)
Buffers: shared hit=1 read=2
Planning Time: 0.400 ms
Execution Time: 0.048 ms

idx_tblusers_lower_email — **expression**-індекс на (lower(email)) — без нього WHERE lower(email) = ... ігнорує будь-який звичайний індекс на email, бо lower() міняє значення. Seq Scan зник, buffers впали з 250 до 3, час з 1.702 мс до 0.048 мс (~35×).

## q4 — повнотекстовий пошук по каталогу тестів

sql
SELECT id, title, ts_rank(search_vector, plainto_tsquery('simple', 'квадратні рівняння')) AS rank
FROM tblTests
WHERE search_vector @@ plainto_tsquery('simple', 'квадратні рівняння')
ORDER BY rank DESC, id
LIMIT 20

### До індексів

Limit (cost=15952.16..15952.21 rows=20 width=112) (actual time=22.006..22.008 rows=20 loops=1)
Buffers: shared hit=14582
-> Sort (cost=15952.16..15952.26 rows=40 width=112) (actual time=22.005..22.006 rows=20 loops=1)
Sort Key: (ts_rank(search_vector, '''квадратні'' & ''рівняння'''::tsquery)) DESC, id
Sort Method: top-N heapsort Memory: 30kB
Buffers: shared hit=14582
-> Seq Scan on tbltests (cost=0.00..15951.10 rows=40 width=112) (actual time=0.068..21.811 rows=2169 loops=1)
Filter: (search_vector @@ '''квадратні'' & ''рівняння'''::tsquery)
Rows Removed by Filter: 107831
Buffers: shared hit=14576
Planning Time: 0.268 ms
Execution Time: 22.036 ms

### Після індексів (3-й прогін — перший холодний для GIN)

Limit (cost=197.06..197.11 rows=20 width=112) (actual time=4.587..4.589 rows=20 loops=1)
Buffers: shared hit=2047
-> Sort (cost=197.06..197.16 rows=43 width=112) (actual time=4.586..4.587 rows=20 loops=1)
Sort Key: (ts_rank(search_vector, '''квадратні'' & ''рівняння'''::tsquery)) DESC, id
Sort Method: top-N heapsort Memory: 30kB
Buffers: shared hit=2047
-> Bitmap Heap Scan on tbltests (cost=30.27..195.91 rows=43 width=112) (actual time=0.445..4.383 rows=2169 loops=1)
Recheck Cond: (search_vector @@ '''квадратні'' & ''рівняння'''::tsquery)
Heap Blocks: exact=2032
Buffers: shared hit=2041
-> Bitmap Index Scan on idx_tbltests_search_vector (cost=0.00..30.26 rows=43 width=0) (actual time=0.297..0.298 rows=2169 loops=1)
Index Cond: (search_vector @@ '''квадратні'' & ''рівняння'''::tsquery)
Buffers: shared hit=9
Planning Time: 0.442 ms
Execution Time: 4.631 ms

idx_tbltests_search_vector (GIN по search_vector) замінив Seq Scan на Bitmap Index Scan + Bitmap Heap Scan: індекс (9 buffers) одразу знаходить 2169 відповідних рядків замість перебору всіх 110 000, buffers впали з 14582 до 2047, час з 22.036 мс до 4.631 мс (~4.8×). Прискорення тут менше, ніж у q1–q3, бо збіги (2% рядків) розкидані по майже всіх сторінках таблиці — Bitmap Heap Scan все одно читає 2032 окремі heap-сторінки; це очікувана поведінка FTS, а не промах індексу.

## Морфологія

sql
SELECT count(_) FROM tblTests WHERE search_vector @@ plainto_tsquery('simple', 'рівняння'); -- 2169
SELECT count(_) FROM tblTests WHERE search_vector @@ plainto_tsquery('simple', 'рівнянь'); -- 5449

Форма «рівняння» (називний/знахідний відмінок множини) знаходить 2169 рядків, а форма «рівнянь» (родовий відмінок множини) — 5449 рядків, і це два повністю різні набори рядків: tsvector побудований з конфігом 'simple', який не робить морфологічний розбір (стемінг) — він просто лексикалізує (нижній регістр + базова токенізація) слово як є, тому «рівняння» і «рівнянь» для нього — два незв'язані, різні лексеми, а не форми одного слова. У pg_ts_config немає запису для української мови (\dF показує лише вбудовані simple, english та інші), тож підміна на russian не вирішила б задачу коректно — це була б чужа морфологія, яка випадково збігається з українською лише частково.
