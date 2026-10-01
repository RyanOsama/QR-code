import { SupabaseClient } from '@supabase/supabase-js';
import type Database from 'better-sqlite3';

export interface MigrationStepProgress {
  stepKey: string;
  title: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped';
  message?: string;
  error?: string;
}

export interface MigrationDefinition {
  version: number;
  name: string;
  titleArabic: string;
  description: string;
  up: (params: { client?: SupabaseClient | null; db?: Database.Database | null }) => Promise<boolean>;
  verify: (params: { client?: SupabaseClient | null; db?: Database.Database | null }) => Promise<boolean>;
}

export interface MigrationStatusResult {
  currentVersion: number;
  requiredVersion: number;
  needsMigration: boolean;
  pendingVersions: number[];
  pendingMigrations: Array<{
    version: number;
    name: string;
    titleArabic: string;
    description: string;
  }>;
}

export interface MigrationExecutionResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  appliedVersions: number[];
  steps: MigrationStepProgress[];
  error?: string;
  failedVersion?: number;
}
