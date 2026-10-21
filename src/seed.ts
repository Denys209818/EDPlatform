import { randomBytes, scryptSync } from "node:crypto";

import dataSource from "./data-source.js";
import { TestEntity, TestStatus } from "./entities/test/test.entity.js";
import { UserEntity } from "./entities/user/user.entity.js";
import { TaskEntity } from "./entities/task/task.entity.js";
import { TaskAnswerEntity } from "./entities/task/taskAnswer.entity.js";
import { TestUserEntity } from "./entities/test/testUser.entity.js";

const USERS = [
  ["Олександр", "Коваленко", "Іванович"],
  ["Марія", "Шевченко", "Петрівна"],
  ["Дмитро", "Бондаренко", "Сергійович"],
  ["Анна", "Ткаченко", "Андріївна"],
  ["Іван", "Кравченко", "Олексійович"],
  ["Оксана", "Олійник", "Миколаївна"],
  ["Сергій", "Шевчук", "Юрійович"],
  ["Наталія", "Поліщук", "Василівна"],
  ["Андрій", "Бойко", "Дмитрович"],
  ["Юлія", "Мельник", "Олександрівна"],
  ["Максим", "Лисенко", "Віталійович"],
  ["Катерина", "Мороз", "Ігорівна"],
] as const;

// [title, description, status, task condition]
const TESTS = [
  [
    "Математика: квадратні рівняння",
    "Розв'язання квадратних рівнянь",
    TestStatus.PUBLISHED,
    "Розв'яжіть рівняння x² − 5x + 6 = 0.",
  ],
  [
    "Фізика: закони Ньютона",
    "Три закони динаміки",
    TestStatus.PUBLISHED,
    "Сформулюйте другий закон Ньютона.",
  ],
  [
    "Хімія: періодична таблиця",
    "Будова періодичної системи",
    TestStatus.PUBLISHED,
    "Скільки електронів на зовнішньому рівні в атома натрію?",
  ],
  [
    "Біологія: клітина",
    "Будова та функції клітини",
    TestStatus.DRAFT,
    "Яка органела відповідає за синтез АТФ?",
  ],
  [
    "Географія: материки",
    "Материки та океани Землі",
    TestStatus.PUBLISHED,
    "Який материк найбільший за площею?",
  ],
  [
    "Інформатика: алгоритми",
    "Базові алгоритмічні конструкції",
    TestStatus.PUBLISHED,
    "Яка складність бінарного пошуку?",
  ],
  [
    "Англійська: Present Simple",
    "Часи англійської мови",
    TestStatus.DRAFT,
    "Утворіть питальну форму: She works here.",
  ],
  [
    "Програмування: цикли",
    "Цикли for, while, do-while",
    TestStatus.PUBLISHED,
    "Скільки разів виконається for (i = 0; i < 5; i++)?",
  ],
  [
    "Робототехніка: датчики",
    "Види датчиків і їх застосування",
    TestStatus.DRAFT,
    "Який датчик вимірює відстань за допомогою ультразвуку?",
  ],
  [
    "Тестування: види тестів",
    "Unit, integration, e2e",
    TestStatus.PUBLISHED,
    "Чим unit-тест відрізняється від integration-тесту?",
  ],
  [
    "Історія: Київська Русь",
    "Заснування та розвиток держави",
    TestStatus.ARCHIEVED,
    "У якому році відбулося Хрещення Русі?",
  ],
  [
    "Українська мова: орфографія",
    "Правопис ненаголошених голосних",
    TestStatus.PUBLISHED,
    "Вставте пропущену літеру: к..пати.",
  ],
] as const;

// [index of the task (== test), answer]
const ANSWERS: ReadonlyArray<readonly [number, string]> = [
  [0, "x = 2 та x = 3"],
  [0, "x = −2 та x = −3"],
  [1, "F = ma"],
  [2, "Один електрон"],
  [3, "Мітохондрія"],
  [4, "Євразія"],
  [5, "O(log n)"],
  [6, "Does she work here?"],
  [7, "П'ять разів"],
  [8, "Ультразвуковий датчик"],
  [8, "Інфрачервоний датчик"],
  [9, "Unit перевіряє окремий модуль, integration — взаємодію модулів"],
  [10, "988 рік"],
  [11, "копати"],
  [11, "купати"],
];

// [user index, test index]
const TEST_USERS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 2],
  [2, 1],
  [2, 5],
  [3, 4],
  [4, 5],
  [5, 7],
  [6, 7],
  [7, 9],
  [8, 11],
  [9, 0],
  [10, 5],
  [11, 9],
];

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}.${scryptSync(password, salt, 32).toString("hex")}`;
}

await dataSource.initialize();

try {
  const existing = await dataSource.getRepository(UserEntity).count();

  if (existing > 0) {
    console.log(`Seed skipped: tblUsers already has ${existing} rows.`);
  } else {
    await dataSource.transaction(async (manager) => {
      const users = await manager.save(
        UserEntity,
        USERS.map(([first, last, middle], i) =>
          manager.create(UserEntity, {
            first_name: first,
            last_name: last,
            middle_name: middle,
            email: `user${i + 1}@example.com`,
            phone_number: `+3809900000${String(i + 1).padStart(2, "0")}`,
            password: hashPassword(`password${i + 1}`),
          }),
        ),
      );

      const tests = await manager.save(
        TestEntity,
        TESTS.map(([title, description, status]) =>
          manager.create(TestEntity, { title, description, status }),
        ),
      );

      const tasks = await manager.save(
        TaskEntity,
        TESTS.map(([, , , condition], i) =>
          manager.create(TaskEntity, { condition, test: tests[i] }),
        ),
      );

      await manager.save(
        TaskAnswerEntity,
        ANSWERS.map(([taskIndex, content]) =>
          manager.create(TaskAnswerEntity, { content, task: tasks[taskIndex] }),
        ),
      );

      await manager.save(
        TestUserEntity,
        TEST_USERS.map(([userIndex, testIndex]) =>
          manager.create(TestUserEntity, {
            user: users[userIndex],
            test: tests[testIndex],
          }),
        ),
      );
    });

    console.log("Seed done.");
  }
} finally {
  await dataSource.destroy();
}
