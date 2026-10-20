INSERT INTO tblUsers (id, first_name, last_name, middle_name, email, phone_number, password, created_at, updated_at, deleted_at)
SELECT
  gen_random_uuid(),
  (ARRAY['Олександр','Дмитро','Іван','Марія','Анна','Оксана','Сергій','Андрій','Наталія','Юлія','Максим','Катерина'])[floor(random() * 12 + 1)],
  (ARRAY['Коваленко','Шевченко','Бондаренко','Ткаченко','Кравченко','Олійник','Шевчук','Поліщук','Бойко','Мельник'])[floor(random() * 10 + 1)],
  CASE WHEN random() < 0.3 THEN
    (ARRAY['Олександрович','Дмитрович','Іванівна','Сергійович','Андріївна','Юрійович'])[floor(random() * 6 + 1)]
  ELSE NULL END,
  'user' || i || '@example.com',
  '+380' || lpad(i::text, 9, '0'),
  '$2b$10$abcdefghijklmnopqrstuvKzQ7Y1v0v0v0v0v0v0v0v0v0v0v0v0',
  now() - (random() * interval '730 days'),
  now() - (random() * interval '365 days'),
  NULL
FROM generate_series(1, 10000) AS s(i);

WITH user_ids AS (
  SELECT array_agg(id) AS ids, count(*) AS n FROM tblUsers
)
INSERT INTO tblTests (id, title, description, status, created_at, created_by, updated_at, deleted_at)
SELECT
  gen_random_uuid(),
  'Тест з ' ||
    (ARRAY['математики','фізики','хімії','біології','географії','інформатики','англійської мови','програмування','робототехніки','тестування'])[floor(random() * 10 + 1)] ||
    ': ' ||
    (ARRAY['основні поняття','контрольна робота','підсумкове тестування','практичні завдання','теоретичні питання','лабораторна робота','самостійна робота','модульний контроль'])[floor(random() * 8 + 1)] ||
    ' (варіант ' || i || ')',
  'Цей тест перевіряє знання учнів за програмою курсу. ' ||
    CASE
      WHEN random() < 0.02 THEN 'Завдання присвячені темі "квадратні рівняння" та методам їх розв''язання. '
      WHEN random() < 0.05 THEN 'У тесті розглядаються складні системи рівнянь та способи розв''язання рівнянь різних типів. '
      ELSE 'Завдання охоплюють ключові теми курсу та практичні приклади. '
    END ||
    'Рекомендований час виконання — ' || (floor(random() * 40 + 20))::int || ' хвилин.',
  (ARRAY['published','published','published','published','published','published','published','draft','draft','archived'])[floor(random() * 10 + 1)],
  now() - (random() * interval '730 days'),
  ui.ids[floor(random() * ui.n + 1)],
  now() - (random() * interval '365 days'),
  NULL
FROM generate_series(1, 110000) AS s(i)
CROSS JOIN user_ids ui;

VACUUM (ANALYZE);