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
