import { describe, it, expect, vi, afterEach } from 'vitest';
import { studentPurgeService } from '../src/services/studentPurgeService';
import { gradeService } from '../src/services/gradeService';
import { supabase } from '../src/lib/supabaseClient';

describe('studentPurgeService - Single Student Test Data Purge Guard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates studentId and rejects empty input', async () => {
    await expect(studentPurgeService.purgeTestStudent('')).rejects.toThrow('กรุณาระบุรหัสนักเรียนที่ต้องการลบ');
  });

  it('flushes outbox and calls purge_test_student_safely RPC', async () => {
    const flushSpy = vi.spyOn(gradeService, 'flushOutbox');
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        success: true,
        blocked_by_guard: false,
        purged_student_id: 'stu-test-99',
      },
      error: null,
    } as any);

    const res = await studentPurgeService.purgeTestStudent('stu-test-99', true);

    expect(flushSpy).toHaveBeenCalled();
    expect(rpcSpy).toHaveBeenCalledWith('purge_test_student_safely', {
      p_student_id: 'stu-test-99',
      p_force: true,
    });
    expect(res.success).toBe(true);
    expect(res.blocked_by_guard).toBe(false);
  });
});
