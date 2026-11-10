import { setTimeout as sleep } from "node:timers/promises";

// Коди Postgres, після яких ту саму транзакцію МОЖНА повторити:
//   40001 — serialization_failure (конфлікт під REPEATABLE READ / SERIALIZABLE)
//   40P01 — deadlock_detected (Postgres сам відкотив одну з транзакцій)
// Усе інше (CHECK, unique, синтаксис, 404/409 з бізнес-логіки) повтор не виправить.
const RETRYABLE_CODES = ["40001", "40P01"];

export interface RetryOptions {
  /** Скільки всього спроб (перша + повтори). */
  maxAttempts?: number;
  /** Базова затримка для backoff, мс. */
  baseDelayMs?: number;
  /** Викликається перед кожним повтором — для логу/лічильника в демо. */
  onRetry?: (attempt: number, code: string, delayMs: number) => void;
}

/**
 * Виконує fn і повторює її, якщо Postgres кинув 40001 / 40P01.
 *
 * ВАЖЛИВО: fn — це ВСЯ транзакція (BEGIN … читання … запис … COMMIT),
 * а не лише запис. Повтор має заново прочитати свіжі дані,
 * інакше це той самий lost update, тільки з ретраєм.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 10, baseDelayMs = 10, onRetry } = options;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const queryErrorCode =
        (error as any).code ?? (error as any).driverError?.code;

      if (!RETRYABLE_CODES.includes(queryErrorCode) || attempt >= maxAttempts) {
        throw error;
      }

      const delayMs = Math.random() * baseDelayMs * 2 ** (attempt - 1);

      console.log(
        `[retry] спроба ${attempt}/${maxAttempts} впала з ${queryErrorCode}, ` +
          `повтор через ${Math.round(delayMs)} мс`,
      );

      onRetry?.(attempt, queryErrorCode, delayMs);
      await sleep(delayMs);
    }
  }
}
