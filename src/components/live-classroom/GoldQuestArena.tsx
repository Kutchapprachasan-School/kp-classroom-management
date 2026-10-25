// src/components/live-classroom/GoldQuestArena.tsx
// สมรภูมิตะลุยคำถามล่าทองคำแบบเรียลไทม์ (Gold Quest Live Arena)
// นำเข้าและเชื่อมต่อโดยตรงกับ components/GoldQuestArena.tsx

import GoldQuestArena, {
  type ArenaStudent,
  type ArenaLog,
  type ArenaQuestion,
  type QuestionBankSet,
  type GoldQuestArenaProps,
} from '../../../components/GoldQuestArena';

export type { ArenaStudent, ArenaLog, ArenaQuestion, QuestionBankSet, GoldQuestArenaProps };
export { GoldQuestArena };
export default GoldQuestArena;
