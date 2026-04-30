export interface DevDataResponse<T> {
  readonly path: string;
  readonly json: T;
}

export async function loadDevJson<T>(path: string): Promise<T> {
  const response = await fetch(`/__dev/data?path=${encodeURIComponent(path)}`);
  const payload = await response.json() as Partial<DevDataResponse<T>> & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Failed to load ${path}`);
  }
  return payload.json as T;
}

export async function saveDevJson(path: string, json: unknown): Promise<void> {
  const response = await fetch('/__dev/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, json })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `Failed to save ${path}`);
  }
}
