export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

export function getAtPath(record: JsonRecord, path: readonly string[]): unknown {
  let current: unknown = record;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

export function setAtPath(record: JsonRecord, path: readonly string[], value: unknown): JsonRecord {
  if (path.length === 0) return record;
  const [head, ...tail] = path;
  if (head === undefined) return record;
  if (tail.length === 0) {
    return { ...record, [head]: value };
  }
  const child = asRecord(record[head]);
  return { ...record, [head]: setAtPath(child, tail, value) };
}

export function parseJsonRecord(text: string): JsonRecord {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed)) {
    throw new Error('Expected a JSON object.');
  }
  return parsed;
}
