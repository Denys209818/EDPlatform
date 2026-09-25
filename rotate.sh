#!/usr/bin/env bash
# Ротація пароля root БЕЗ рестарту застосунку.
#
# Порядок кроків важливий:
#   1. ALTER ROLE у БД (нове значення стає істиною);
#   2. одразу оновити файл-секрет (нові конекшени беруть уже новий пароль);
#   3. прибити СТАРІ зʼєднання root — довести, що наступний запит
#      відкриє нове зʼєднання вже з новим паролем.
#
# Між 1 і 2 є вікно у мілісекунди, коли нове зʼєднання зі старим паролем
# впаде. У продакшн-менеджерах (AWS Secrets Manager rotation, Vault database
# engine) це лікують ДВОМА користувачами, що чергуються (alternating users):
# поки живе user_a, ротують user_b — вікна нема взагалі.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

NEW_PASSWORD="db-$(openssl rand -hex 8)"

echo "1. ALTER ROLE у Postgres…"
docker compose exec -T db psql -U root -d marketplace \
  -c "ALTER ROLE root WITH PASSWORD '${NEW_PASSWORD}';" >/dev/null

# Між цим кроком і наступним є вікно: у БД пароль уже НОВИЙ, а у файлі ще СТАРИЙ.
# Застосунок, який саме зараз відкриває зʼєднання, отримає 28P01. Тому ротацію
# роблять або через дві дійсні версії секрету, або в момент низького трафіку.

echo "2. Оновлюю файл-секрет…"
printf '%s' "${NEW_PASSWORD}" > secrets/db_password

echo "3. Закриваю старі зʼєднання root…"
# pid <> pg_backend_pid(): у нас немає окремої admin-ролі, тож термінація рве і
# власну psql-сесію, яка виконує цей запит, — виключаємо її явно.
docker compose exec -T db psql -U root -d marketplace -tA \
  -c "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE usename = 'root' AND pid <> pg_backend_pid();"

echo "Готово: новий пароль ${NEW_PASSWORD:0:6}… уже в БД і у файлі."
echo "Застосунок НЕ рестартував — перевір: curl -s localhost:3000/health"
