export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

type FetchJsonOptions = {
  timeoutMs?: number;
  retries?: number;
  headers?: HeadersInit;
  body?: string;
  method?: "GET" | "POST";
  /** Next.js fetch cache hint, in seconds. 0 disables caching. */
  revalidate?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One fetch helper for every source: bounded timeout, a couple of retries on
 * transient failures, and a Next cache hint. Third-party APIs here are flaky
 * (Jikan 504s, TVMaze rate-limits), so nothing is allowed to hang a request.
 */
export async function fetchJson<T>(
  url: string,
  {
    timeoutMs = 8000,
    retries = 2,
    headers,
    body,
    method = "GET",
    revalidate = 3600,
  }: FetchJsonOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        next: revalidate > 0 ? { revalidate } : undefined,
        cache: revalidate > 0 ? undefined : "no-store",
      });

      if (!response.ok) {
        throw new HttpError(
          `Request failed (${response.status})`,
          response.status,
          url,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const status = error instanceof HttpError ? error.status : undefined;
      const retryable = status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt === retries) break;
      await sleep(250 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Fetch failed: ${url}`);
}
