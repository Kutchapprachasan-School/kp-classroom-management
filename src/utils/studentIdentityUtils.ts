// src/utils/studentIdentityUtils.ts
/**
 * Utility functions for resolving student identity and classroom normalization
 * Re-exports canonical helpers from sgsRosterAndSubmissionService to prevent architectural drift.
 */
export {
  normalizeClassroomCode,
  isSameClassroom,
  resolveStudentIdentity,
  matchSubmissionToAssignment,
  type RosterIdentityRecord,
  type SubmissionMatchCandidate,
  type AssignmentMatchTarget,
} from '../services/sgsRosterAndSubmissionService';

export interface StudentIdentityCandidate {
  id?: string;
  studentCode?: string;
  code?: string;
  name?: string;
  classroom?: string;
  classroomId?: string;
}
