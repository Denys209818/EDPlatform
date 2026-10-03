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

Повний цикл перевірки (схема → seed → EXPLAIN до → індекси → EXPLAIN після):

```bash
docker compose exec -T db psql -U root -d marketplace -f - < db/schema.sql
docker compose exec -T db psql -U root -d marketplace -f - < db/seed.sql
docker compose exec -T db psql -U root -d marketplace -c "EXPLAIN (ANALYZE, BUFFERS) $(cat db/queries/q1.sql)"
docker compose exec -T db psql -U root -d marketplace -f - < db/indexes.sql
docker compose exec -T db psql -U root -d marketplace -c "ANALYZE;"
docker compose exec -T db psql -U root -d marketplace -c "EXPLAIN (ANALYZE, BUFFERS) $(cat db/queries/q1.sql)"
```

Результати та пояснення — db/OPTIMIZATIONS.md.
