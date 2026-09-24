-- ====================================================================
-- Production Database Invariants (Custom Migration for PostgreSQL)
-- Apply via: prisma migrate dev --create-only
-- ====================================================================

-- 3.1 CHECK Constraint: ป้องกันคะแนนติดลบ และป้องกันคะแนนเกิน Assignment.maxScore
ALTER TABLE "Score" ADD CONSTRAINT "score_value_check" CHECK (value >= 0);

CREATE OR REPLACE FUNCTION check_score_max_value() RETURNS trigger AS $$
BEGIN
  IF NEW.value > (SELECT "maxScore" FROM "Assignment" WHERE id = NEW."assignmentId") THEN
    RAISE EXCEPTION 'Score value % exceeds Assignment maxScore', NEW.value;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_score
  BEFORE INSERT OR UPDATE ON "Score"
  FOR EACH ROW EXECUTE FUNCTION check_score_max_value();

-- 3.2 ป้องกันการแก้ไขสถานะ LOCKED โดยเด็ดขาดระดับ DB Engine
CREATE OR REPLACE FUNCTION prevent_locked_score_update() RETURNS trigger AS $$
BEGIN
  -- ถ้าสถานะเดิมเป็น LOCKED แล้วมีความพยายามจะ UPDATE ข้อมูล
  IF OLD.state = 'LOCKED' AND NEW.state = 'LOCKED' THEN
    RAISE EXCEPTION 'Cannot modify a locked score (ID: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_locked_score
  BEFORE UPDATE ON "Score"
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_score_update();

-- 3.3 XP Reconciliation (Total XP Cache Sync อัตโนมัติจาก XpLedger)
CREATE OR REPLACE FUNCTION sync_gamification_xp() RETURNS trigger AS $$
DECLARE
  v_userId TEXT;
BEGIN
  -- หา userId จาก Enrollment
  SELECT "userId" INTO v_userId FROM "Enrollment" WHERE id = NEW."enrollmentId";
  
  -- Reconcile ยอด totalXp ลงตาราง GamificationProfile
  UPDATE "GamificationProfile" 
  SET "totalXp" = "totalXp" + NEW.amount 
  WHERE "userId" = v_userId;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_total_xp_on_ledger_insert
  AFTER INSERT ON "XpLedger"
  FOR EACH ROW EXECUTE FUNCTION sync_gamification_xp();
