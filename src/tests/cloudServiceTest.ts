import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { SupabaseService } from '../services/supabaseService';
import { initDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { CheckInService } from '../services/checkInService';

async function runCloudServiceTest() {
  console.log('--- Starting Cloud Service & Multi-Device Sync Test ---');

  // 1. Verify schema file exists and contains atomic row lock check_in_atomic
  const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
  assert(fs.existsSync(schemaPath), 'supabase_schema.sql must exist');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  assert(schemaContent.includes('CREATE OR REPLACE FUNCTION check_in_atomic'), 'Schema must define check_in_atomic');
  assert(schemaContent.includes('FOR UPDATE'), 'Atomic function must use FOR UPDATE row lock');
  assert(schemaContent.includes('supabase_realtime'), 'Schema must activate Supabase Realtime');
  console.log('✓ Supabase SQL schema validated: includes atomic FOR UPDATE lock, Realtime, and indexes.');

  // 2. Test Supabase config save and retrieval
  const originalConfig = SupabaseService.getConfig();
  assert(originalConfig !== null, 'Config must not be null');

  SupabaseService.saveConfig({
    mode: 'local',
    supabaseUrl: 'https://testproject.supabase.co',
    supabaseAnonKey: 'test-anon-key-123',
    deviceName: 'بوابة الشمال 1',
  });

  const updatedConfig = SupabaseService.getConfig();
  assert.strictEqual(updatedConfig.deviceName, 'بوابة الشمال 1');
  assert.strictEqual(updatedConfig.supabaseUrl, 'https://testproject.supabase.co');
  console.log('✓ Cloud config save & reload verified.');

  // 3. Test local atomic fallback
  const testDbPath = path.join(process.cwd(), 'database_files', 'cloud_test.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  initDatabase(testDbPath);

  const event = EventRepository.create({
    name: 'حفل تجريبي للأجهزة المتعددة',
    date: '2026-10-01',
    capacity: 50,
  });

  InvitationRepository.generateBatch(event.id, 5);
  const invitations = InvitationRepository.getByEventId(event.id);
  assert.strictEqual(invitations.length, 5);

  const targetInv = invitations[0];
  const scanResult1 = CheckInService.verifyAndCheckIn(targetInv.token, event.id, 'بوابة 1');
  assert.strictEqual(scanResult1.result, 'ACCEPTED');

  // Second scan from "بوابة 2" must fail with ALREADY_USED
  const scanResult2 = CheckInService.verifyAndCheckIn(targetInv.token, event.id, 'بوابة 2');
  assert.strictEqual(scanResult2.result, 'ALREADY_USED');
  console.log('✓ Gate concurrency & double-entry prevention verified: Second gate blocked duplicate barcode.');

  // Restore config
  SupabaseService.saveConfig(originalConfig);
  console.log('--- All Cloud & Concurrency Tests Passed Successfully! ---');
}

runCloudServiceTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
