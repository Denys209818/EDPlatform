# Educational Platform API

Навчальна платформа типу Kahoot — вчитель створює задачі (`/tasks`), збирає їх у тести (`/tests`), учні проходять і отримують результат. API описаний в `openapi/openapi.yaml`, звідти й пагінація списків, і `Idempotency-Key` на створенні.

Варіант ДЗ#9 — Б, runtime-валідація на кордоні. Сервер на NestJS + Express, `express-openapi-validator` валідує запити й відповіді проти спеки, помилки перекладаються у `application/problem+json`.

## Запуск

```bash
npm install
npm start
```

Піднімається на localhost:3000.

## Перевірка спеки

```bash
npx @redocly/cli lint openapi/openapi.yaml

grep -c 'Idempotency-Key' openapi/openapi.yaml
grep -c 'next_cursor' openapi/openapi.yaml
grep -c 'application/problem+json' openapi/openapi.yaml
```

## Перевірка застосунку

Після `npm start`:

```bash
curl -i -X POST localhost:3000/tasks -H "Content-Type: application/json" -d '{}'
# без Idempotency-Key -> 400 problem+json

curl -i -X POST localhost:3000/tasks -H "Idempotency-Key: k1" -H "Content-Type: application/json" \
  -d '{"title":"t","condition":"c","imageUrl":"https://example.com/i.png","options":[]}'
# менше 2 options -> 400 з деталями від валідатора

curl -i -X POST localhost:3000/tasks -H "Idempotency-Key: k1" -H "Content-Type: application/json" \
  -d '{"title":"t","condition":"c","imageUrl":"https://example.com/i.png","options":[{"text":"a","isCorrect":true},{"text":"b","isCorrect":false}]}'
# валідний запит -> 201

curl -i -X POST localhost:3000/tasks -H "Idempotency-Key: k1" -H "Content-Type: application/json" \
  -d '{"title":"t","condition":"c","imageUrl":"https://example.com/i.png","options":[{"text":"a","isCorrect":true},{"text":"b","isCorrect":false}]}'
# той самий ключ + те саме тіло -> 201, той самий id

curl -i -X POST localhost:3000/tasks -H "Idempotency-Key: k1" -H "Content-Type: application/json" \
  -d '{"title":"other","condition":"c","imageUrl":"https://example.com/i.png","options":[{"text":"a","isCorrect":true},{"text":"b","isCorrect":false}]}'
# той самий ключ + інше тіло -> 422

curl -i localhost:3000/tasks/does-not-exist
# 404 problem+json

curl "localhost:3000/tests?limit=1"
# лапки обов'язкові, бо zsh сприймає ? як glob
```

Структура: `src/tasks` і `src/tests` — самі ресурси (controller + service + dto), `src/exceptions` — переклад помилок у problem+json, `openapi/openapi.yaml` — контракт.

## Configuration

Змінні середовища (`.env`, контракт — `.env.example`):

| Змінна             | Призначення                                                                                               | Джерело                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `PORT`             | порт застосунку                                                                                           | `.env`                                                                              |
| `DB_HOST`          | хост Postgres                                                                                             | `.env`                                                                              |
| `DB_PORT`          | порт Postgres                                                                                             | `.env`                                                                              |
| `DB_USER`          | роль Postgres                                                                                             | `.env`                                                                              |
| `DB_NAME`          | назва БД                                                                                                  | `.env`                                                                              |
| `DB_PASSWORD_FILE` | шлях до файла-секрета з паролем БД (`secrets/db_password`)                                                | `.env` + `secrets/db_password` (не в git)                                           |
| `DB_URL`           | опціональний повний рядок підключення до БД ДЗ #12 (альтернатива `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_NAME`) | `.env` (локально); у dev/prod — значення з того самого сховища, що й решта секретів |

Запуск:

```bash
docker compose up -d --build
```

Ротація пароля БД (без рестарту сервісу):

```bash
bash rotate.sh
```

Скрипт міняє пароль ролі, оновлює `secrets/db_password` і рве старі з'єднання — `pg.Pool` перечитує файл на нове з'єднання, `curl localhost:3000/health` продовжує відповідати 200 з uptime, що росте.

## База даних (ДЗ #12 - схема, seed, пошук)

Головна таблиця і таблиця пошуку (q4) — одна й та сама: tblTests (110 000+ рядків; має created_by, status, search_vector).

Підняти базу (свіжий клон, чистий volume):

```bash
docker compose up -d --wait db
```

Підключитись:

```bash
docker compose exec db psql -U root -d marketplace
```

Повний цикл перевірки (схема -> seed -> EXPLAIN до -> індекси -> EXPLAIN після):

```bash
docker compose exec -T db psql -U root -d marketplace -f - < db/schema.sql
docker compose exec -T db psql -U root -d marketplace -f - < db/seed.sql
docker compose exec -T db psql -U root -d marketplace -c "EXPLAIN (ANALYZE, BUFFERS) $(cat db/queries/q1.sql)"
docker compose exec -T db psql -U root -d marketplace -f - < db/indexes.sql
docker compose exec -T db psql -U root -d marketplace -c "ANALYZE;"
docker compose exec -T db psql -U root -d marketplace -c "EXPLAIN (ANALYZE, BUFFERS) $(cat db/queries/q1.sql)"
```

Результати та пояснення — db/OPTIMIZATIONS.md.

npm run migration:generate -- InitTables

## ORM (ДЗ #13)

### N+1: демо і фікс

npm run demo:nplus1 вмикає logging: ['query'], виконує запит "тести -> завдання -> відповіді" (8 тестів, 16 завдань) різними способами і друкує кількість SQL-запитів:

| Стратегія                         | Кількість запитів |
| --------------------------------- | ----------------- |
| наївно (запит у циклі)            | 25 (1 + 8 + 16)   |
| `relations` / `leftJoinAndSelect` | 1                 |
| `relationLoadStrategy: 'query'`   | 5                 |

Наївний варіант росте разом з розміром даних, обидва фікси - ні: JOIN дає один запит, `query` — по запиту на рівень зв'язків.

### QueryBuilder vs Repository

npm run report виводить статистику по тестах (кількість завдань і учасників): агрегати COUNT(DISTINCT ...), GROUP BY і два LEFT JOIN, результат через getRawMany().

Межа проходить за формою результату: якщо на виході entity, використовуємо Repository. Якщо потрібні агрегати, GROUP BY чи плоскі рядки, які не відповідають жодній entity, використовуємо QueryBuilder.

### Секрети: scripts/with-secrets.sh

`scripts/with-secrets.sh [env] [команда...]` запускає команду з секретами з Infisical (логін береться з `.secrets/infisical.env`, поза git). `SKIP_VAULT=1` пропускає сховище й виконує команду зі значеннями, які вже є в оточенні (для CI і грейдера).

## Конкурентність (ДЗ #14)

### Домен

Ключова бізнес-операція — купівля тесту (функція `checkout` у `src/modules/tests/checkout.ts`):

Одна транзакція: лок юзера -> лок тесту -> перевірка місць -> seats_left - 1 -> списання балансу -> `INSERT` доступу (`ON CONFLICT DO NOTHING`, повторна покупка -> 409) -> `INSERT` задачі в `tblJobs` -> `COMMIT`. Будь-яка помилка -> `ROLLBACK` усього, тож замовлень-«сиріт» і задач без покупки не буває. Нові таблиці/колонки — міграціями `AddFieldSeatsLeft` і `AddJobsQueue`.

### Числа з запусків

`npm run demo:race` запускає 50 паралельних покупок одного тесту з 10 місцями: **успішних 10 із 50**, фінальний `seats_left` 0, рядків із відʼємним `seats_left` 0.

`npm run demo:workers` віддає 40 задач по 100 мс чотирьом воркерам: кожен обробив по **10 задач**, оброблено двічі: **0**, загальний час **~1085 мс** проти 4000 мс послідовно (прискорення ×3.7).

`npm run demo:retry` робить 10 паралельних поповнень балансу по 10 під `REPEATABLE READ`: спіймано й повторено **28–35 конфліктів** (усі `40001`), фінальний баланс **100**.

Усі три скрипти самі перевіряють інваріант і завершуються з кодом 1, якщо він порушений. Свої дані (тест, юзери, задачі з міткою запуску) вони створюють і прибирають самі, тож їх можна запускати повторно.

### Pessimistic lock (`SELECT ... FOR UPDATE`), а не атомарний `UPDATE`

Checkout лочить рядок тесту через `SELECT seats_left, "isPaid", price … FOR UPDATE`, а вже потім перевіряє місця в коді й робить `UPDATE seats_left = seats_left - 1`. Атомарний `UPDATE … WHERE seats_left >= 1 RETURNING` теж захистив би від oversell одним запитом, але на 0 рядків він не каже чому: тест не існує (404) чи місця скінчились (409) — довелося б робити додатковий `SELECT`. Крім того, рішення залежить від кількох колонок (`seats_left`, `isPaid`, `price`) і від балансу юзера, тож зручніше один раз заблокувати рядки й спокійно перевірити все в коді. Ціна — зайвий round-trip і те, що конкурентні покупки одного тесту чекають одна одну на локу; транзакція коротка, тож для нас це прийнятно. Порядок локів у checkout завжди однаковий (юзер -> тест), тому дедлоків між покупками немає.

### Воркери: `FOR UPDATE SKIP LOCKED`

Кожен воркер у своїй транзакції бере одну задачу `... WHERE status = 'PENDING' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`, обробляє її і в тій самій транзакції ставить `DONE` + `processed = processed + 1`. `FOR UPDATE` гарантує, що задачу не візьмуть двічі, а `SKIP LOCKED` — що інші воркери не чекають на лок, а беруть наступну вільну. Порожній результат означає «вільних немає зараз», тому воркер перепитує `count(*)` і завершується лише коли черга справді порожня. Для швидкого пошуку — частковий індекс `IDX_jobs_pending ON "tblJobs"(created_at) WHERE status = 'PENDING'`.

### Retry: чому лише `40001` і `40P01`

`withRetry` (`src/modules/database/with-retry.ts`) повторює транзакцію **цілком**, разом із читаннями: повтор лише запису зі старим прочитаним значенням — це той самий lost update. Ловить тільки два коди, бо лише вони означають «транзакція коректна, просто програла конкурентну гонку, наступна спроба може пройти»: `40001` (serialization_failure — конфлікт під `REPEATABLE READ`/`SERIALIZABLE`) і `40P01` (deadlock_detected — Postgres сам відкотив одну зі сторін). Інші помилки (unique, CHECK, синтаксис, бізнесові 404/409) повтор не виправить — він лише подвоїть навантаження і сховає баг.

Затримка — exponential backoff із full jitter: `random(0 ... 10 мс · 2^(спроба−1))`, максимум 10 спроб, кожен повтор логується. Порівняння на тому ж демо: з фіксованою експонентою й малим jitter (`10 · 2^n + random(0...10)`) транзакції виходили строго по одній за раунд — рівно 45 retry і остання проходила на 9-му повторі з 10; з full jitter — 28–35 retry, найгірший випадок 5–7-ма спроба.

## Grading

Запуск на свіжому клоні без доступу до Infisical:

```bash
cp .env.example .env
mkdir -p secrets && echo "changeme" > secrets/db_password   # файл не в git
docker compose up -d db --wait

export DB_HOST=localhost DB_PORT=5432 DB_USER=root DB_NAME=marketplace
export DB_PASSWORD_FILE=secrets/db_password SKIP_VAULT=1

npm ci
npm run migration:run
npm run seed
npm run report

# ДЗ #14 — конкурентність (кожен скрипт сам перевіряє інваріант: exit 0 / 1)
npm run demo:race
npm run demo:workers
npm run demo:retry
```

SKIP_VAULT=1 змушує scripts/with-secrets.sh пропустити Infisical і виконати команду зі змінними з оточення. Паролем у secrets/db_password може бути будь-який рядок: Postgres бере його при першому створенні тому pgdata.
