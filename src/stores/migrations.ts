/**
 * Save schema versioning and migrations
 */

export const SAVE_SCHEMA_VERSION = 1;

/**
 * Migration functions for upgrading save data
 * Key: target version, Value: migration function
 */
export const migrations: Record<number, (data: unknown) => unknown> = {
  // Example: migrating from v0 (no schema) to v1
  // 1: (data) => ({ ...data, schemaVersion: 1 })
};

/**
 * Apply all necessary migrations to bring data up to current version
 */
export function applyMigrations(data: { schemaVersion?: number }): unknown {
  const currentVersion = data.schemaVersion ?? 0;
  let migrated = data;

  for (let v = currentVersion + 1; v <= SAVE_SCHEMA_VERSION; v++) {
    const migrate = migrations[v];
    if (migrate) {
      migrated = migrate(migrated) as { schemaVersion?: number };
    }
  }

  return migrated;
}
