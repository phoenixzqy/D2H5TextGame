import { closeSync, fstatSync, fsyncSync, ftruncateSync, openSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { encodeObservation } from '../sim/contracts/observation-codec';

/** Lossless JSONL in concatenated gzip members; the cap counts physical persisted bytes. */
export function openCampaignJournal(file: string, maxBytes = 190 * 1024 * 1024) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0)
    throw new RangeError('Campaign journal budget must be a positive safe integer');
  const fd = openSync(file, 'wx', 0o600);
  let bytes = 0, uncompressedBytes = 0, closed = false, failed = false;
  return {
    get bytes() { return bytes; },
    get uncompressedBytes() { return uncompressedBytes; },
    append(record: Readonly<Record<string, unknown>>) {
      if (closed) throw new Error('Campaign journal is closed');
      if (failed) throw new Error('Campaign journal failed; further appends refused');
      const raw = Buffer.from(`${JSON.stringify(encodeObservation(record))}\n`);
      const member = gzipSync(raw);
      if (bytes + member.length > maxBytes)
        throw new Error('Campaign journal budget reached; 10 MiB reserved for reports');
      try {
        writeFileSync(fd, member);
        fsyncSync(fd);
      } catch (error) {
        failed = true;
        try {
          ftruncateSync(fd, bytes);
          fsyncSync(fd);
        } catch (rollbackError) {
          bytes = fstatSync(fd).size;
          throw new AggregateError([error, rollbackError], 'Campaign journal append and rollback failed');
        }
        throw error;
      }
      bytes += member.length;
      uncompressedBytes += raw.length;
    },
    close() {
      if (!closed) { closeSync(fd); closed = true; }
    }
  };
}
