import { MigrationDefinition } from './types';
import { v1CoreMigration } from './v1_core';
import { v2SecurityAndPerformanceMigration } from './v2_security_and_performance';
import { v3CardTemplatesMigration } from './v3_card_templates';

/**
 * Ordered list of all database schema migrations.
 * To add a new version in the future (e.g. v3, v4), create the file and add it sequentially here.
 */
export const MIGRATIONS_REGISTRY: MigrationDefinition[] = [
  v1CoreMigration,
  v2SecurityAndPerformanceMigration,
  v3CardTemplatesMigration,
];

/**
 * Returns the latest required schema version according to application code.
 */
export function getLatestRequiredVersion(): number {
  if (MIGRATIONS_REGISTRY.length === 0) return 1;
  return Math.max(...MIGRATIONS_REGISTRY.map((m) => m.version));
}

/**
 * Retrieves a migration definition by its version number.
 */
export function getMigrationByVersion(version: number): MigrationDefinition | undefined {
  return MIGRATIONS_REGISTRY.find((m) => m.version === version);
}

/**
 * Returns all pending migrations that have version > currentVersion, in ascending order.
 */
export function getPendingMigrations(currentVersion: number): MigrationDefinition[] {
  return MIGRATIONS_REGISTRY.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );
}
