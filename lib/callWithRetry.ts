import delay from "./delay";

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number
): Promise<T> {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        throw error;
      }
      await delay(1000 * attempts);
    }
  }
  throw new Error("Unexpected error in callWithRetry");
}
