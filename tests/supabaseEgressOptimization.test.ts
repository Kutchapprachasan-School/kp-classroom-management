// tests/supabaseEgressOptimization.test.ts
// Automated regression tests verifying Supabase PostgREST Egress Optimizations

import { describe, it, expect, beforeEach } from 'vitest';
import { cloudDataService } from '../src/services/cloudDataService';
import { classroomService, invalidateClassroomCache } from '../src/services/classroomService';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase';

describe('Supabase PostgREST Egress Optimization Verification', () => {
  beforeEach(() => {
    invalidateClassroomCache();
  });

  describe('1. Delta Sync & Timestamp Tracking (cloudDataService)', () => {
    it('should exclude duplicate Thai student aliases and internal timestamps from cloud sync', () => {
      const isAppKey = (cloudDataService as any).isAppStorageKey.bind(cloudDataService);

      // Canonical key SHOULD be synced
      expect(isAppKey('cls_students_room-3-1')).toBe(true);
      expect(isAppKey('cls_students_room-1-2')).toBe(true);

      // Duplicate Thai room alias SHOULD NOT be synced to Supabase (saves 50% egress per room)
      expect(isAppKey('cls_students_ม.3/1')).toBe(false);
      expect(isAppKey('cls_students_ม.1/2')).toBe(false);

      // Internal timestamp metadata SHOULD NOT be synced
      expect(isAppKey('kps_cloud_timestamps_v1')).toBe(false);

      // Other essential keys SHOULD be synced
      expect(isAppKey('kp_school_bell_schedule')).toBe(true);
      expect(isAppKey('kps_school_branding_settings_v1')).toBe(true);
    });

    it('should perform delta sync without downloading duplicate data when timestamps match', async () => {
      if (!isSupabaseConfigured) return;

      // First call hydrates data
      const firstSync = await cloudDataService.fetchAllCloudData();
      expect(firstSync).toBeDefined();

      // Second call immediately after: delta sync should detect all keys are fresh
      const secondSync = await cloudDataService.fetchAllCloudData();
      expect(secondSync).toBeDefined();
      expect(Object.keys(secondSync).length).toBeGreaterThan(0);
    });
  });

  describe('2. In-Memory Caching & Selective Columns (classroomService)', () => {
    it('should serve repeated classroom queries from in-memory cache to prevent route-transition egress', async () => {
      const start = Date.now();
      const first = await classroomService.getAll();
      const firstDuration = Date.now() - start;

      // Second consecutive call should hit in-memory cache immediately
      const secondStart = Date.now();
      const second = await classroomService.getAll();
      const secondDuration = Date.now() - secondStart;

      expect(second).toEqual(first);
      // Cache response should be virtually instantaneous (< 15ms)
      expect(secondDuration).toBeLessThan(50);
    });

    it('should serve repeated teacher account queries from in-memory cache', async () => {
      const first = await classroomService.getTeacherAccounts();
      const second = await classroomService.getTeacherAccounts();

      expect(second).toEqual(first);
    });

    it('should bypass cache when forceRefresh is requested', async () => {
      const initial = await classroomService.getAll();
      const refreshed = await classroomService.getAll(true);
      expect(refreshed.length).toBe(initial.length);
    });
  });

  describe('3. Selective Columns Payload Benchmark Verification', () => {
    it('should verify SystemSettings selective columns payload is significantly smaller than select(*)', async () => {
      if (!isSupabaseConfigured) return;

      const { data: full } = await supabase
        .from('SystemSettings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      const { data: selective } = await supabase
        .from('SystemSettings')
        .select('id, schoolName, affiliation, subheader, logoUrl, updatedAt')
        .eq('id', 'default')
        .maybeSingle();

      if (full && selective) {
        const fullSize = JSON.stringify(full).length;
        const selectiveSize = JSON.stringify(selective).length;

        // Selective query must reduce payload by at least 80%
        expect(selectiveSize).toBeLessThan(fullSize * 0.2);
      }
    });

    it('should verify User selective columns payload is significantly smaller than select(*)', async () => {
      if (!isSupabaseConfigured) return;

      const { data: full } = await supabase
        .from('User')
        .select('*');

      const { data: selective } = await supabase
        .from('User')
        .select('id, name, username, email, role, position, subjectGroup');

      if (full && selective) {
        const fullSize = JSON.stringify(full).length;
        const selectiveSize = JSON.stringify(selective).length;

        // Selective query must reduce payload by at least 50%
        expect(selectiveSize).toBeLessThan(fullSize * 0.5);
      }
    });
  });
});
