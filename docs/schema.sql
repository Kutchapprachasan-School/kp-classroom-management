-- =====================================================================
-- FULL POSTGRESQL DATABASE SCHEMA
-- Project: KP-School-Management-System
-- Account: panchapon@udkp.ac.th
-- Database: Neon Serverless PostgreSQL (Singapore)
-- Generated at: 2026-10-17T05:44:03.113Z
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CUSTOM ENUMS (69)
-- ---------------------------------------------------------------------

CREATE TYPE "AccessLevel" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "ApprovalStepStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');
CREATE TYPE "AssignmentPolicyType" AS ENUM ('CENTRALIZED', 'DEPARTMENT', 'HYBRID');
CREATE TYPE "AssignmentTargetType" AS ENUM ('RESOURCE', 'DRIVER');
CREATE TYPE "AttachmentCategory" AS ENUM ('HOME_VISIT_FAMILY', 'HOME_VISIT_HOUSE_EXTERIOR', 'HOME_VISIT_HOUSE_INTERIOR', 'BEHAVIOR_EVIDENCE', 'CASE_INTERVENTION_DOCUMENT');
CREATE TYPE "AttachmentEntityType" AS ENUM ('HOME_VISIT', 'BEHAVIOR_EVIDENCE', 'CASE_DOC');
CREATE TYPE "AttachmentStatus" AS ENUM ('UPLOAD_PENDING', 'UPLOAD_CLEANUP', 'ACTIVE', 'PENDING_DELETE', 'DELETING');
CREATE TYPE "AttendanceExemptionStatus" AS ENUM ('NONE', 'PENDING_REVIEW', 'EXEMPTED_OFFICIAL', 'REJECTED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'EARLY_OUT', 'ABSENT', 'ON_LEAVE', 'WORK_FROM_HOME');
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'ADMIN', 'SYSTEM', 'MIGRATION');
CREATE TYPE "AuditEventType" AS ENUM ('POLICY_ACKNOWLEDGED', 'CONSENT_GIVEN', 'CONSENT_WITHDRAWN', 'CONSENT_REVOKED');
CREATE TYPE "AuditSubjectType" AS ENUM ('POLICY_DOCUMENT', 'CONSENT_RECORD');
CREATE TYPE "BehaviorCategory" AS ENUM ('PUNCTUALITY', 'DRESS_CODE', 'ATTENDANCE', 'SUBSTANCE_ABUSE', 'VIOLENCE_BULLYING', 'GAMBLING', 'HONOR_INTEGRITY', 'VOLUNTEER_MERIT', 'ACADEMIC_EXCELLENCE', 'SPECIAL_ACHIEVEMENT', 'OTHER');
CREATE TYPE "BehaviorLedgerType" AS ENUM ('DEMERIT', 'MERIT', 'CORRECTION_CREDIT', 'CORRECTION_DEBIT');
CREATE TYPE "CaseOutcome" AS ENUM ('PENDING', 'IMPROVED', 'STABLE', 'WORSENED');
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'FOLLOW_UP', 'RESOLVED', 'CLOSED', 'ESCALATED', 'CANCELLED');
CREATE TYPE "CctManifestStatus" AS ENUM ('PENDING_UPLOAD', 'VERIFIED', 'FAILED');
CREATE TYPE "CctPovertyLevel" AS ENUM ('EXTREMELY_POOR', 'POOR', 'NOT_POOR');
CREATE TYPE "ConsentStatus" AS ENUM ('GIVEN', 'WITHDRAWN', 'REVOKED');
CREATE TYPE "DataCategoryType" AS ENUM ('GENERAL_IDENTITY', 'CONTACT_INFO', 'EMPLOYMENT_RECORD', 'SENSITIVE_HEALTH', 'SENSITIVE_BIOMETRIC', 'GEOLOCATION', 'DOCUMENT_ATTACHMENT', 'SYSTEM_AUDIT_LOG');
CREATE TYPE "DetectionStatus" AS ENUM ('SINGLE_MARK', 'MULTIPLE_MARKS', 'NO_MARK', 'AMBIGUOUS', 'LOW_CONFIDENCE');
CREATE TYPE "DisposalMethod" AS ENUM ('SECURE_DESTROY', 'PERMANENT_ANONYMIZE', 'TRANSFER_TO_NATIONAL_ARCHIVES');
CREATE TYPE "DutyType" AS ENUM ('INSPECTOR', 'HR_HEAD', 'HR_STAFF', 'DIVISION_HEAD', 'DEPT_HEAD');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'TRANSFERRED_OUT', 'COMPLETED', 'DROPPED');
CREATE TYPE "EvaluatorType" AS ENUM ('TEACHER', 'PARENT', 'STUDENT');
CREATE TYPE "ExamItemStatus" AS ENUM ('CORRECT', 'INCORRECT', 'BLANK', 'MULTIPLE_MARKS', 'FLAGGED_FOR_REVIEW', 'MANUALLY_OVERRIDDEN');
CREATE TYPE "ExamSheetType" AS ENUM ('SHEET_20_ITEMS', 'SHEET_50_ITEMS', 'SHEET_75_ITEMS', 'SHEET_100_ITEMS', 'CUSTOM');
CREATE TYPE "ExamTerm" AS ENUM ('MIDTERM', 'FINAL', 'SPECIAL');
CREATE TYPE "LegalBasisType" AS ENUM ('PUBLIC_TASK', 'LEGAL_OBLIGATION', 'CONTRACT', 'CONSENT', 'LEGITIMATE_INTEREST', 'VITAL_INTEREST');
CREATE TYPE "MigrationStatus" AS ENUM ('PENDING', 'UPLOADED', 'VERIFIED', 'CUTOVER', 'FAILED');
CREATE TYPE "NominationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ISSUED');
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
CREATE TYPE "PlanningStatus" AS ENUM ('SETUP', 'IN_PLANNING', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "PolicyType" AS ENUM ('PRIVACY_NOTICE', 'TERMS_OF_USE');
CREATE TYPE "RegradeJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SUPERSEDED');
CREATE TYPE "RepairCategory" AS ENUM ('ELECTRICAL', 'PLUMBING', 'BUILDING', 'IT', 'FURNITURE', 'AIR_CONDITIONER', 'OTHER');
CREATE TYPE "RepairPhotoType" AS ENUM ('BEFORE', 'AFTER', 'ATTACHMENT');
CREATE TYPE "RepairStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RepairUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_USE', 'COMPLETED');
CREATE TYPE "ResourceStatus" AS ENUM ('AVAILABLE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED');
CREATE TYPE "ResourceType" AS ENUM ('MEETING_ROOM', 'CLASSROOM', 'LABORATORY', 'VEHICLE', 'EQUIPMENT', 'OTHER');
CREATE TYPE "RetentionRuleType" AS ENUM ('EVENT_BASED', 'FISCAL_YEAR_BASED', 'STATUTORY_LOG_90_DAYS');
CREATE TYPE "RevocationReasonCode" AS ENUM ('ADMINISTRATIVE_DISCONTINUATION', 'SYSTEM_MIGRATION', 'STATUTORY_LEGAL_ORDER', 'ACCOUNT_DECOMMISSIONED');
CREATE TYPE "RiskLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NORMAL');
CREATE TYPE "RoomLayoutType" AS ENUM ('THEATER', 'CLASSROOM', 'U_SHAPE', 'BANQUET', 'BOARDROOM', 'HOLLOW_SQUARE', 'CUSTOM');
CREATE TYPE "SLAStatus" AS ENUM ('ON_TIME', 'OVERDUE');
CREATE TYPE "ScheduledSessionType" AS ENUM ('REGULAR', 'MAKEUP', 'CANCELLED_HOLIDAY', 'CANCELLED_TEACHER_DUTY', 'CANCELLED_SCHOOL_EVENT');
CREATE TYPE "ScopeDepartment" AS ENUM ('THAI', 'MATH', 'SCIENCE', 'FOREIGN_LANG', 'SOCIAL', 'HEALTH_PE', 'ART', 'CAREER', 'STUDENT_DEV');
CREATE TYPE "ScopeDivision" AS ENUM ('ACADEMIC', 'PERSONNEL', 'GENERAL', 'BUDGET');
CREATE TYPE "SdqLevel" AS ENUM ('NORMAL', 'AT_RISK', 'PROBLEM');
CREATE TYPE "Section26ConditionType" AS ENUM ('EXPLICIT_CONSENT', 'VITAL_INTEREST_EMERGENCY', 'NON_PROFIT_BODY_LEGITIMATE_ACTIVITY', 'MANIFESTLY_PUBLIC_DATA', 'LEGAL_CLAIMS_AND_DEFENSE', 'LABOR_AND_SOCIAL_SECURITY_LAW', 'STATUTORY_PUBLIC_HEALTH', 'SUBSTANTIAL_PUBLIC_INTEREST');
CREATE TYPE "StorageProviderType" AS ENUM ('R2', 'LOCAL', 'SUPABASE', 'NEON');
CREATE TYPE "StudentAttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'ACTIVITY');
CREATE TYPE "StudentDecommissionReason" AS ENUM ('DUPLICATE_RECORD_MERGE', 'COURT_OR_LEGAL_ORDER', 'DATA_MIGRATION_CLEANUP', 'SYSTEM_DECOMMISSION');
CREATE TYPE "StudentGender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "StudentIdentityStatus" AS ENUM ('IDENTIFIED', 'UNMAPPED', 'AMBIGUOUS', 'BLANK', 'UNRESOLVED', 'PHANTOM');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRANSFERRED', 'DROPPED_OUT', 'GRADUATED');
CREATE TYPE "SubmissionSyncStatus" AS ENUM ('PENDING_SYNC', 'SYNCED', 'CONFLICT', 'SUPERSEDED');
CREATE TYPE "SubstituteWorkflowStatus" AS ENUM ('ASSIGNED', 'ACKNOWLEDGED', 'REJECTED');
CREATE TYPE "SupervisionStatus" AS ENUM ('SCHEDULED', 'WAITING_TEACHER_ACK', 'WAITING_DIRECTOR_SIGN', 'COMPLETED');
CREATE TYPE "SupervisionType" AS ENUM ('ON_SITE', 'ONLINE_VIDEO');
CREATE TYPE "TemplateOrientation" AS ENUM ('LANDSCAPE', 'PORTRAIT');
CREATE TYPE "TemplateScope" AS ENUM ('PRIVATE', 'SCHOOL_SHARED', 'SYSTEM_PRESET');
CREATE TYPE "TimetableVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'COMMITTED', 'ABORTED');
CREATE TYPE "VehicleMissionType" AS ENUM ('OFFICIAL_MEETING', 'STUDENT_COMPETITION', 'FIELD_TRIP', 'COMMUNITY_SERVICE', 'OTHER');
CREATE TYPE "WithdrawalReasonCode" AS ENUM ('USER_CHOICE', 'NO_LONGER_USING_FEATURE', 'DATA_MINIMIZATION_PREFERENCE');

-- ---------------------------------------------------------------------
-- 2. BASE TABLES (133)
-- ---------------------------------------------------------------------

CREATE TABLE "AMSSCredentials" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "url" TEXT NOT NULL DEFAULT ''::text,
  "lastSyncAt" TIMESTAMP WITHOUT TIME ZONE,
  "sessionCookie" TEXT,
  "sessionExpiresAt" TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT "AMSSCredentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicCalendar" (
  "id" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "AcademicCalendar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicEvent" (
  "id" TEXT NOT NULL,
  "calendarId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "locksTimetable" BOOLEAN NOT NULL DEFAULT false,
  "locksSupervision" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcademicEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITHOUT TIME ZONE,
  "refreshTokenExpiresAt" TIMESTAMP WITHOUT TIME ZONE,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityExpense" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "allocationId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "expenseDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "title" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "receiptNo" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED'::text,
  "rejectedReason" TEXT,
  "submittedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP WITHOUT TIME ZONE,
  "rejectedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ActivityExpense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityTrancheAllocation" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "budgetTrancheId" TEXT NOT NULL,
  "allocatedAmount" NUMERIC NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ActivityTrancheAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalStage" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "stageOrder" INTEGER NOT NULL,
  "stageName" TEXT NOT NULL,
  "roleName" TEXT NOT NULL,
  "isMandatory" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ApprovalStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalStep" (
  "id" TEXT NOT NULL,
  "planningSessionId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "roleRequired" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING'::text,
  "comment" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalWorkflow" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "attendanceDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "checkInTime" TIMESTAMP WITHOUT TIME ZONE,
  "checkOutTime" TIMESTAMP WITHOUT TIME ZONE,
  "status" "AttendanceStatus" NOT NULL,
  "workShiftId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendanceLog" (
  "id" TEXT NOT NULL,
  "attendanceId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "timestamp" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "deviceInfo" TEXT,
  "verificationHash" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendanceNonce" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceNonce_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendancePhoto" (
  "id" TEXT NOT NULL,
  "attendanceId" TEXT NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "faceMatchScore" DOUBLE PRECISION,
  "isLivenessPassed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendancePhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actorNameSnapshot" TEXT NOT NULL,
  "actorRoleSnapshot" TEXT NOT NULL,
  "actorDepartmentSnapshot" TEXT,
  "requestId" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'WEB_PORTAL'::text,
  "previousState" JSONB,
  "newState" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "tableName" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "field" TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "changedBy" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BehaviorRecord" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "sequenceNo" BIGINT NOT NULL,
  "type" "BehaviorLedgerType" NOT NULL,
  "category" "BehaviorCategory" NOT NULL,
  "points" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "businessDate" DATE NOT NULL,
  "incidentTimestamp" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "location" TEXT,
  "description" TEXT NOT NULL,
  "correctionForId" TEXT,
  "reportedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BehaviorRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetReceipt" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "budgetTrancheId" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "receivedDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "documentRef" TEXT,
  "bankStatement" TEXT,
  "notes" TEXT,
  "confirmedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "BudgetReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetSource" (
  "id" TEXT NOT NULL,
  "fiscalYearId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "totalPlannedAmount" NUMERIC NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "BudgetSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetTranche" (
  "id" TEXT NOT NULL,
  "budgetSourceId" TEXT NOT NULL,
  "trancheNo" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "semester" INTEGER NOT NULL,
  "expectedStartDate" TIMESTAMP WITHOUT TIME ZONE,
  "expectedEndDate" TIMESTAMP WITHOUT TIME ZONE,
  "plannedAmount" NUMERIC NOT NULL DEFAULT 0,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "BudgetTranche_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetTransfer" (
  "id" TEXT NOT NULL,
  "fiscalYearId" TEXT NOT NULL,
  "fromAllocationId" TEXT NOT NULL,
  "toAllocationId" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "reason" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING'::text,
  "approvedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "BudgetTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CctExportManifest" (
  "id" TEXT NOT NULL,
  "exportCode" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "criteriaJson" JSONB NOT NULL,
  "recordCount" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "payloadSha256" TEXT NOT NULL,
  "byteSize" BIGINT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "status" "CctManifestStatus" NOT NULL DEFAULT 'PENDING_UPLOAD'::"CctManifestStatus",
  "verifiedAt" TIMESTAMP WITHOUT TIME ZONE,
  "verifiedById" TEXT,
  "failureReason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CctExportManifest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CertificateIssuedItem" (
  "id" TEXT NOT NULL,
  "batchRecordId" TEXT NOT NULL,
  "seqNo" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "certificateNumber" TEXT NOT NULL,
  "roleTitle" TEXT NOT NULL,
  "recipientName" TEXT,
  "verifyToken" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ISSUED'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CertificateIssuedItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CertificateTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "templateVersion" INTEGER NOT NULL DEFAULT 1,
  "orientation" "TemplateOrientation" NOT NULL DEFAULT 'LANDSCAPE'::"TemplateOrientation",
  "backgroundAttachmentId" TEXT NOT NULL,
  "layoutConfig" JSONB NOT NULL,
  "scope" "TemplateScope" NOT NULL DEFAULT 'PRIVATE'::"TemplateScope",
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassRoom" (
  "id" TEXT NOT NULL,
  "gradeLevel" INTEGER NOT NULL,
  "roomNumber" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "adviser" TEXT,
  "status" TEXT,
  CONSTRAINT "ClassRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetencyEvaluation" (
  "id" TEXT NOT NULL,
  "paAgreementId" TEXT NOT NULL,
  "evaluatorId" TEXT NOT NULL,
  "evaluatorRole" TEXT NOT NULL,
  "dimension1Score" INTEGER NOT NULL,
  "dimension2Score" INTEGER NOT NULL,
  "dimension3Score" INTEGER NOT NULL,
  "dimension4Score" INTEGER NOT NULL,
  "dimension5Score" INTEGER NOT NULL,
  "comments" TEXT,
  "evaluatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompetencyEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentAuditLog" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "eventType" "AuditEventType" NOT NULL,
  "subjectType" "AuditSubjectType" NOT NULL,
  "userId" TEXT NOT NULL,
  "policyDocumentId" TEXT,
  "policyVersionSnapshot" TEXT,
  "contentHashSnapshot" TEXT,
  "purposeId" TEXT,
  "purposeCodeSnapshot" TEXT,
  "consentRecordId" TEXT,
  "consentFormVersionSnapshot" TEXT,
  "actorType" "AuditActorType" NOT NULL DEFAULT 'USER'::"AuditActorType",
  "actorId" TEXT,
  "source" TEXT NOT NULL,
  "withdrawalReason" "WithdrawalReasonCode",
  "revocationReason" "RevocationReasonCode",
  "reasonDetail" TEXT,
  "occurredAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "ConsentAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purposeId" TEXT NOT NULL,
  "status" "ConsentStatus" NOT NULL DEFAULT 'GIVEN'::"ConsentStatus",
  "consentFormVersion" TEXT NOT NULL,
  "privacyNoticeVersion" TEXT,
  "consentedAt" TIMESTAMP WITHOUT TIME ZONE,
  "withdrawnAt" TIMESTAMP WITHOUT TIME ZONE,
  "revokedAt" TIMESTAMP WITHOUT TIME ZONE,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseWeightFactor" (
  "id" TEXT NOT NULL,
  "subjectCode" TEXT NOT NULL,
  "preparationWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "labWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
  "assessmentWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "CourseWeightFactor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentConfig" (
  "id" TEXT NOT NULL,
  "docType" TEXT NOT NULL,
  "memoSectionId" TEXT,
  "prefix" TEXT NOT NULL DEFAULT ''::text,
  "useThaiNumerals" BOOLEAN NOT NULL DEFAULT true,
  "paddingDigits" INTEGER NOT NULL DEFAULT 1,
  "yearFormat" TEXT NOT NULL DEFAULT 'TH_BE'::text,
  "currentSeq" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "DocumentConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentRecord" (
  "id" TEXT NOT NULL,
  "docType" TEXT NOT NULL,
  "memoSectionId" TEXT,
  "docNo" TEXT,
  "seqNo" INTEGER,
  "year" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "content" TEXT NOT NULL,
  "signeeName" TEXT NOT NULL,
  "signeePosition" TEXT NOT NULL,
  "enclosures" TEXT,
  "references" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT'::text,
  "cancelReason" TEXT,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "department" TEXT,
  "requester" TEXT,
  "idempotencyKey" TEXT,
  "attachmentName" TEXT,
  "attachmentUrl" TEXT,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletedById" TEXT,
  "purgeAt" TIMESTAMP WITHOUT TIME ZONE,
  "deleteReason" TEXT,
  CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentRelation" (
  "id" TEXT NOT NULL,
  "fromId" TEXT NOT NULL,
  "toId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentRouting" (
  "id" TEXT NOT NULL,
  "incomingDocId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL DEFAULT 1,
  "assigneeId" TEXT NOT NULL,
  "assignedById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING'::text,
  "resolution" TEXT,
  "note" TEXT,
  "deadline" TIMESTAMP WITHOUT TIME ZONE,
  "completedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "acknowledgedAt" TIMESTAMP WITHOUT TIME ZONE,
  "actionAttachmentUrl" TEXT,
  "actionReport" TEXT,
  "assigneeName" TEXT,
  "directiveText" TEXT,
  "dueDate" TIMESTAMP WITHOUT TIME ZONE,
  "signatureUrl" TEXT,
  "standardDirective" TEXT,
  CONSTRAINT "DocumentRouting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "docType" TEXT NOT NULL,
  "memoSectionId" TEXT,
  "title" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "signeeName" TEXT NOT NULL,
  "signeePosition" TEXT NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriverProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "licenseExpiry" TIMESTAMP WITHOUT TIME ZONE,
  "phoneNumber" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAnswerKey" (
  "id" TEXT NOT NULL,
  "examPaperId" TEXT NOT NULL,
  "versionCode" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExamAnswerKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAnswerKeyItem" (
  "id" TEXT NOT NULL,
  "answerKeyId" TEXT NOT NULL,
  "itemNo" INTEGER NOT NULL,
  "correctChoices" text[],
  "points" NUMERIC NOT NULL DEFAULT 1.00,
  "penaltyPoints" NUMERIC NOT NULL DEFAULT 0.00,
  CONSTRAINT "ExamAnswerKeyItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAnswerKeyVersion" (
  "id" TEXT NOT NULL,
  "examPaperId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "keyPayload" JSONB NOT NULL,
  "totalItems" INTEGER NOT NULL,
  "maxScore" NUMERIC NOT NULL,
  "changedById" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamAnswerKeyVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAuditLog" (
  "id" TEXT NOT NULL,
  "examPaperIdSnapshot" TEXT NOT NULL,
  "submissionIdSnapshot" TEXT,
  "action" TEXT NOT NULL,
  "performedByUserId" TEXT NOT NULL,
  "details" JSONB NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamItemOverride" (
  "id" TEXT NOT NULL,
  "submissionItemId" TEXT NOT NULL,
  "sequenceNo" BIGINT NOT NULL,
  "previousChoice" TEXT,
  "overrideChoice" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamItemOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamItemSubmission" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "itemNo" INTEGER NOT NULL,
  "detectedChoices" text[],
  "fillRatios" JSONB NOT NULL,
  "confidenceScore" NUMERIC NOT NULL,
  "overrideVersion" INTEGER NOT NULL DEFAULT 0,
  "detectionStatus" "DetectionStatus" NOT NULL DEFAULT 'SINGLE_MARK'::"DetectionStatus",
  "overrideChoice" TEXT,
  "effectiveChoice" TEXT,
  "isOverridden" BOOLEAN NOT NULL DEFAULT false,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  "scoreEarned" NUMERIC NOT NULL DEFAULT 0,
  "status" "ExamItemStatus" NOT NULL DEFAULT 'CORRECT'::"ExamItemStatus",
  CONSTRAINT "ExamItemSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPaper" (
  "id" TEXT NOT NULL,
  "subjectCode" TEXT NOT NULL,
  "subjectName" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "gradeLevel" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "totalItems" INTEGER NOT NULL DEFAULT 50,
  "maxScore" NUMERIC NOT NULL,
  "passScore" NUMERIC NOT NULL,
  "totalSubjectiveItems" INTEGER NOT NULL DEFAULT 0,
  "subjectiveMaxScore" NUMERIC NOT NULL DEFAULT 0.00,
  "createdById" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletedById" TEXT,
  "purgeAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExamPaper_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPeriod" (
  "id" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "examType" "ExamTerm" NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "desksPerRoom" INTEGER NOT NULL DEFAULT 30,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExamPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPrintedSheet" (
  "id" TEXT NOT NULL,
  "sheetToken" TEXT NOT NULL,
  "examPaperId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "classroom" TEXT,
  "seatNo" INTEGER,
  "attemptNo" INTEGER NOT NULL DEFAULT 1,
  "isUsed" BOOLEAN NOT NULL DEFAULT false,
  "usedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamPrintedSheet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamProctorAssignment" (
  "id" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "teacherName" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "roomName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MAIN_PROCTOR'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamProctorAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamRegradeJob" (
  "id" TEXT NOT NULL,
  "examPaperId" TEXT NOT NULL,
  "targetKeyVersionId" TEXT NOT NULL,
  "status" "RegradeJobStatus" NOT NULL DEFAULT 'PENDING'::"RegradeJobStatus",
  "workerToken" TEXT,
  "leaseExpiresAt" TIMESTAMP WITHOUT TIME ZONE,
  "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
  "processedSubmissions" INTEGER NOT NULL DEFAULT 0,
  "snapshotEndCreatedAt" TIMESTAMP WITHOUT TIME ZONE,
  "snapshotEndId" TEXT,
  "cursorCreatedAt" TIMESTAMP WITHOUT TIME ZONE,
  "cursorId" TEXT,
  "batchSize" INTEGER NOT NULL DEFAULT 50,
  "errorMessage" TEXT,
  "createdById" TEXT,
  "startedAt" TIMESTAMP WITHOUT TIME ZONE,
  "completedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExamRegradeJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamSubjectSlot" (
  "id" TEXT NOT NULL,
  "examPeriodId" TEXT NOT NULL,
  "subjectCode" TEXT NOT NULL,
  "subjectName" TEXT NOT NULL,
  "gradeLevel" TEXT NOT NULL,
  "examDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "durationMins" INTEGER NOT NULL DEFAULT 90,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExamSubjectSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamSubjectiveItem" (
  "id" TEXT NOT NULL,
  "examPaperId" TEXT NOT NULL,
  "itemNo" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "maxScore" NUMERIC NOT NULL,
  "rubricDetail" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExamSubjectiveItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamSubmission" (
  "id" TEXT NOT NULL,
  "clientScanId" TEXT NOT NULL,
  "examPaperId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "classroom" TEXT,
  "seatNo" INTEGER,
  "versionCode" TEXT NOT NULL DEFAULT '01'::text,
  "attemptNo" INTEGER NOT NULL DEFAULT 1,
  "isLatestAttempt" BOOLEAN NOT NULL DEFAULT true,
  "rawScore" NUMERIC NOT NULL,
  "subjectiveScore" NUMERIC NOT NULL DEFAULT 0.00,
  "subjectiveScores" JSONB,
  "netScore" NUMERIC NOT NULL,
  "totalCorrect" INTEGER NOT NULL DEFAULT 0,
  "totalIncorrect" INTEGER NOT NULL DEFAULT 0,
  "totalBlanks" INTEGER NOT NULL DEFAULT 0,
  "totalMultiple" INTEGER NOT NULL DEFAULT 0,
  "gradingVersion" INTEGER NOT NULL DEFAULT 1,
  "gradingVersionId" TEXT,
  "confidenceAvg" NUMERIC NOT NULL,
  "hasAnomalies" BOOLEAN NOT NULL DEFAULT false,
  "isVerifiedByTeacher" BOOLEAN NOT NULL DEFAULT false,
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP WITHOUT TIME ZONE,
  "scannedImageKey" TEXT,
  "syncStatus" "SubmissionSyncStatus" NOT NULL DEFAULT 'SYNCED'::"SubmissionSyncStatus",
  "rawImageHash" TEXT,
  "processedImageHash" TEXT,
  "rawStorageKey" TEXT,
  "processedStorageKey" TEXT,
  "detectorVersion" TEXT DEFAULT 'REV_9.0_HYBRID'::text,
  "thresholdProfile" TEXT DEFAULT 'STANDARD_A4'::text,
  "ingestedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "studentCodeSnapshot" TEXT,
  "classSnapshot" TEXT,
  "examRosterId" TEXT,
  "studentIdentityStatus" "StudentIdentityStatus" NOT NULL DEFAULT 'IDENTIFIED'::"StudentIdentityStatus",
  "mappingReason" TEXT,
  "scannedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "scannedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExamSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamTemplate" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "sheetType" "ExamSheetType" NOT NULL DEFAULT 'SHEET_50_ITEMS'::"ExamSheetType",
  "canvasWidth" INTEGER NOT NULL DEFAULT 1654,
  "canvasHeight" INTEGER NOT NULL DEFAULT 2339,
  "gridMetadata" JSONB NOT NULL,
  "calibrationDefaults" JSONB NOT NULL,
  "isDeprecated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseAttachment" (
  "id" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL,
  "storageProvider" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "uploadedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpenseAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseReversal" (
  "id" TEXT NOT NULL,
  "originalExpenseId" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "reason" TEXT NOT NULL,
  "cancelledByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'APPROVED'::text,
  "approvedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ExpenseReversal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacilityApprovalPolicy" (
  "id" TEXT NOT NULL,
  "moduleType" "ResourceType" NOT NULL,
  "stepNo" INTEGER NOT NULL,
  "roleRequired" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slaHours" INTEGER NOT NULL DEFAULT 24,
  "bufferHoursBefore" INTEGER NOT NULL DEFAULT 6,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "FacilityApprovalPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacilityApprovalStep" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "revisionNo" INTEGER NOT NULL DEFAULT 1,
  "stepNo" INTEGER NOT NULL,
  "roleRequired" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "ApprovalStepStatus" NOT NULL DEFAULT 'PENDING'::"ApprovalStepStatus",
  "approverUserId" TEXT,
  "comment" TEXT,
  "actedAt" TIMESTAMP WITHOUT TIME ZONE,
  "idempotencyKey" CHARACTER VARYING,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "FacilityApprovalStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacilityPostMissionReport" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "startMileage" DOUBLE PRECISION,
  "endMileage" DOUBLE PRECISION,
  "distanceKm" DOUBLE PRECISION,
  "fuelCost" NUMERIC,
  "fuelReceiptKey" TEXT,
  "incidentNotes" TEXT,
  "vehicleConditionRating" INTEGER,
  "roomCleanlinessRating" INTEGER,
  "reportedByUserId" TEXT NOT NULL,
  "reportedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "FacilityPostMissionReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacilityReservation" (
  "id" TEXT NOT NULL,
  "bookingNumber" TEXT,
  "resourceId" TEXT NOT NULL,
  "reservedByUserId" TEXT NOT NULL,
  "consumerModule" TEXT NOT NULL DEFAULT 'MANUAL'::text,
  "title" TEXT NOT NULL,
  "purpose" TEXT,
  "startAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "expiresAt" TIMESTAMP WITHOUT TIME ZONE,
  "attendeeCount" INTEGER,
  "department" TEXT,
  "contactPhone" TEXT,
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING'::"ReservationStatus",
  "currentStep" INTEGER NOT NULL DEFAULT 1,
  "totalSteps" INTEGER NOT NULL DEFAULT 2,
  "revisionNo" INTEGER NOT NULL DEFAULT 1,
  "rejectionReason" TEXT,
  "attachments" JSONB,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "idempotencyKey" CHARACTER VARYING,
  "idempotencyPayloadHash" CHARACTER VARYING,
  CONSTRAINT "FacilityReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacilityReservationRevision" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "revisionNo" INTEGER NOT NULL,
  "snapshotPayload" JSONB NOT NULL,
  "submittedByUserId" TEXT NOT NULL,
  "submittedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revisionReason" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FacilityReservationRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacilityResource" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "ResourceType" NOT NULL,
  "capacity" INTEGER,
  "location" TEXT,
  "description" TEXT,
  "status" "ResourceStatus" NOT NULL DEFAULT 'AVAILABLE'::"ResourceStatus",
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "FacilityResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacilitySettings" (
  "id" TEXT NOT NULL DEFAULT 'default'::text,
  "guidelinesHtml" TEXT,
  "hotlinePhone" TEXT DEFAULT '042-261234'::text,
  "buildingHotline" TEXT DEFAULT 'โทรภายใน 104'::text,
  "vehicleHotline" TEXT DEFAULT 'โทรภายใน 105'::text,
  "driverAssignerUserIds" TEXT NOT NULL DEFAULT ''::text,
  "driverPoolUserIds" TEXT NOT NULL DEFAULT ''::text,
  "approverStep1UserIds" TEXT NOT NULL DEFAULT ''::text,
  "approverStep2UserIds" TEXT NOT NULL DEFAULT ''::text,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "FacilitySettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FileAttachment" (
  "id" TEXT NOT NULL,
  "storageProvider" "StorageProviderType" NOT NULL DEFAULT 'R2'::"StorageProviderType",
  "objectKey" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" BIGINT NOT NULL,
  "checksumSha256" TEXT NOT NULL,
  "accessLevel" "AccessLevel" NOT NULL DEFAULT 'PRIVATE'::"AccessLevel",
  "leaveRequestId" TEXT,
  "incomingDocumentId" TEXT,
  "documentRecordId" TEXT,
  "systemSettingsId" TEXT,
  "attachmentStatus" "AttachmentStatus" NOT NULL DEFAULT 'ACTIVE'::"AttachmentStatus",
  "orphanedAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletingAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletionLeaseId" TEXT,
  "uploadExpiresAt" TIMESTAMP WITHOUT TIME ZONE,
  "uploadSessionId" TEXT,
  "cleanupAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastCleanupError" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalYear" (
  "id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE'::text,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Holiday" (
  "id" TEXT NOT NULL,
  "startDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "name" TEXT NOT NULL,
  "isCustom" BOOLEAN NOT NULL DEFAULT false,
  "isWorkday" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IncomingDocument" (
  "id" TEXT NOT NULL,
  "receiveNo" TEXT NOT NULL,
  "receiveDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "senderOrg" TEXT NOT NULL,
  "docRefNo" TEXT,
  "title" TEXT NOT NULL,
  "urgencyLevel" TEXT NOT NULL DEFAULT 'NORMAL'::text,
  "amssLink" TEXT,
  "attachmentUrl" TEXT,
  "memoSectionId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING'::text,
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "amssOriginId" TEXT,
  CONSTRAINT "IncomingDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionActivity" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "actionDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "activityTitle" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "nextFollowUpDate" TIMESTAMP WITHOUT TIME ZONE,
  "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InterventionActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeaveArchive" (
  "id" TEXT NOT NULL,
  "cycleLabel" TEXT NOT NULL,
  "cycleStart" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "cycleEnd" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "data" TEXT NOT NULL,
  "totalStaff" INTEGER NOT NULL DEFAULT 0,
  "totalDays" INTEGER NOT NULL DEFAULT 0,
  "archivedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaveArchive_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeaveConfig" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "maxDaysPerYear" INTEGER NOT NULL DEFAULT 0,
  "warningThreshold" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "LeaveConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeaveRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "startDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING'::text,
  "documentUrl" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "execApproverId" TEXT,
  "headApproverId" TEXT,
  "rejectReason" TEXT,
  "extraFields" TEXT,
  "approvedSeq" INTEGER,
  "fiscalYear" INTEGER,
  "pendingSeq" INTEGER,
  "execApprovedAt" TIMESTAMP WITHOUT TIME ZONE,
  "headApprovedAt" TIMESTAMP WITHOUT TIME ZONE,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletedById" TEXT,
  "purgeAt" TIMESTAMP WITHOUT TIME ZONE,
  "deleteReason" TEXT,
  "inspectorSnapshot" JSONB,
  "headApproverSnapshot" JSONB,
  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoSection" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6366f1'::text,
  "icon" TEXT NOT NULL DEFAULT 'Folder'::text,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "MemoSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboxEvent" (
  "id" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING'::"OutboxEventStatus",
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaAgreement" (
  "id" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "teacherId" TEXT NOT NULL,
  "teacherName" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "agreementTitle" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "PaAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaTargetConfig" (
  "id" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "targetPdHours" INTEGER NOT NULL DEFAULT 20,
  "competencyMaxScore" INTEGER NOT NULL DEFAULT 5,
  "description" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "PaTargetConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PdHourLog" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "topic" TEXT NOT NULL,
  "organizer" TEXT NOT NULL,
  "hours" DOUBLE PRECISION NOT NULL,
  "completedDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "certificateUrl" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PdHourLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanningSandboxScenario" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "payloadJson" JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "PlanningSandboxScenario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanningSession" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "curriculumVersionId" TEXT,
  "status" "PlanningStatus" NOT NULL DEFAULT 'SETUP'::"PlanningStatus",
  "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "PlanningSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyAcknowledgment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "policyDocumentId" TEXT NOT NULL,
  "policyVersionSnapshot" TEXT NOT NULL,
  "contentHashSnapshot" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'WEB_APP'::text,
  "acknowledgedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "PolicyAcknowledgment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyDocument" (
  "id" TEXT NOT NULL,
  "type" "PolicyType" NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentMarkdown" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "canonicalEngineVersion" TEXT NOT NULL DEFAULT 'v1'::text,
  "effectiveAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "publishedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessingActivity" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "controllerName" TEXT NOT NULL DEFAULT 'โรงเรียนกุดจับประชาสรรค์'::text,
  "dpoContact" TEXT NOT NULL DEFAULT 'kpschool_dpo@obec.moe.go.th'::text,
  "dataSubjectCategory" TEXT NOT NULL,
  "retentionRuleType" "RetentionRuleType" NOT NULL DEFAULT 'EVENT_BASED'::"RetentionRuleType",
  "retentionDurationMonths" INTEGER NOT NULL,
  "retentionAuthority" TEXT NOT NULL,
  "disposalMethod" "DisposalMethod" NOT NULL DEFAULT 'SECURE_DESTROY'::"DisposalMethod",
  "recipientsSummary" TEXT NOT NULL,
  "crossBorderTransfer" BOOLEAN NOT NULL DEFAULT false,
  "crossBorderDetails" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ProcessingActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessingDataCategoryPolicy" (
  "id" TEXT NOT NULL,
  "purposeId" TEXT NOT NULL,
  "dataCategory" "DataCategoryType" NOT NULL,
  "legalBasis" "LegalBasisType" NOT NULL,
  "section26Condition" "Section26ConditionType",
  "statutoryReference" TEXT,
  "isMandatoryForOperation" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ProcessingDataCategoryPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessingPurpose" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ProcessingPurpose_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "fiscalYearId" TEXT NOT NULL,
  "budgetSourceId" TEXT NOT NULL,
  "departmentName" TEXT,
  "leaderUserId" TEXT NOT NULL,
  "leaderName" TEXT NOT NULL DEFAULT ''::text,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetAcademicYear" INTEGER NOT NULL,
  "allocatedAmount" NUMERIC NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'APPROVED'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectActivity" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "responsibleUserId" TEXT NOT NULL,
  "activityNo" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "allocatedAmount" NUMERIC NOT NULL DEFAULT 0,
  "plannedStartDate" TIMESTAMP WITHOUT TIME ZONE,
  "plannedEndDate" TIMESTAMP WITHOUT TIME ZONE,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectAttachment" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "storageProvider" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "uploadedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadinessIndicator" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "expression" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ReadinessIndicator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendationRun" (
  "id" TEXT NOT NULL,
  "leaveRequestId" TEXT NOT NULL,
  "timetableSlotId" TEXT NOT NULL,
  "policy" TEXT NOT NULL,
  "candidatesJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepairPhoto" (
  "id" TEXT NOT NULL,
  "repairId" TEXT NOT NULL,
  "photoType" "RepairPhotoType" NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedById" TEXT NOT NULL,
  CONSTRAINT "RepairPhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepairRequest" (
  "id" TEXT NOT NULL,
  "repairNo" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "urgency" "RepairUrgency" NOT NULL DEFAULT 'NORMAL'::"RepairUrgency",
  "category" "RepairCategory" NOT NULL DEFAULT 'OTHER'::"RepairCategory",
  "status" "RepairStatus" NOT NULL DEFAULT 'PENDING'::"RepairStatus",
  "version" INTEGER NOT NULL DEFAULT 1,
  "requesterId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "resolutionNote" TEXT,
  "cost" NUMERIC,
  "materialsUsed" TEXT,
  "cancelReason" TEXT,
  "expectedFinishAt" TIMESTAMP WITHOUT TIME ZONE,
  "actualFinishAt" TIMESTAMP WITHOUT TIME ZONE,
  "slaStatus" "SLAStatus",
  "assignedAt" TIMESTAMP WITHOUT TIME ZONE,
  "finishedAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletedAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletedBy" TEXT,
  "deleteReason" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "ratedAt" TIMESTAMP WITHOUT TIME ZONE,
  "rating" INTEGER,
  "ratingComment" TEXT,
  CONSTRAINT "RepairRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReservationResourceAssignment" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "targetType" "AssignmentTargetType" NOT NULL,
  "resourceId" TEXT,
  "driverProfileId" TEXT,
  "driverLicenseSnapshot" TEXT,
  "driverLicenseExpirySnapshot" TIMESTAMP WITHOUT TIME ZONE,
  "qualificationVerifiedAt" TIMESTAMP WITHOUT TIME ZONE,
  "qualificationStatusAtAssignment" TEXT DEFAULT 'VALID'::text,
  "assignedByUserId" TEXT,
  "startAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING'::"ReservationStatus",
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ReservationResourceAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResourceItem" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 40,
  "location" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "ResourceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResourceReservation" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "reservedBy" TEXT NOT NULL,
  "reservedFor" TEXT NOT NULL,
  "startTime" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'APPROVED'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResourceReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Room" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "building" TEXT,
  "roomType" TEXT NOT NULL DEFAULT 'REGULAR'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomProfile" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "floor" TEXT,
  "hasProjector" BOOLEAN NOT NULL DEFAULT true,
  "hasSoundSystem" BOOLEAN NOT NULL DEFAULT true,
  "hasVideoConference" BOOLEAN NOT NULL DEFAULT false,
  "airConditionerCount" INTEGER NOT NULL DEFAULT 2,
  CONSTRAINT "RoomProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomReservationDetail" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "layoutType" "RoomLayoutType" NOT NULL DEFAULT 'THEATER'::"RoomLayoutType",
  "layoutNotes" TEXT,
  "audioVisualNotes" TEXT,
  "cateringNotes" TEXT,
  "requireAirCon" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "RoomReservationDetail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RunningNumber" (
  "key" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "current" INTEGER NOT NULL,
  CONSTRAINT "RunningNumber_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "ScheduledClassSession" (
  "id" TEXT NOT NULL,
  "offeringId" TEXT NOT NULL,
  "businessDate" DATE NOT NULL,
  "periodNumber" INTEGER NOT NULL,
  "sessionType" "ScheduledSessionType" NOT NULL DEFAULT 'REGULAR'::"ScheduledSessionType",
  "isEligibleDenominator" BOOLEAN NOT NULL DEFAULT true,
  "cancellationReason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduledClassSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolConfig" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "assignmentPolicy" "AssignmentPolicyType" NOT NULL DEFAULT 'DEPARTMENT'::"AssignmentPolicyType",
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "SchoolConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SdqNormsRegistry" (
  "id" TEXT NOT NULL,
  "instrumentVersion" TEXT NOT NULL,
  "scoringVersion" TEXT NOT NULL,
  "evaluatorType" "EvaluatorType" NOT NULL,
  "targetAgeMin" INTEGER NOT NULL,
  "targetAgeMax" INTEGER NOT NULL,
  "reverseScoredItems" JSONB NOT NULL,
  "subscaleDefinitions" JSONB NOT NULL,
  "cutoffsJson" JSONB NOT NULL,
  "isImmutable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SdqNormsRegistry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignatureTokenLog" (
  "jti" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "docId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP WITHOUT TIME ZONE,
  "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "SignatureTokenLog_pkey" PRIMARY KEY ("jti")
);

CREATE TABLE "SigneePreset" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "isCommon" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "SigneePreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StorageMigrationLog" (
  "id" TEXT NOT NULL,
  "sourceTable" TEXT NOT NULL,
  "sourceRecordId" TEXT NOT NULL,
  "sourceField" TEXT NOT NULL,
  "attachmentSlot" INTEGER NOT NULL DEFAULT 0,
  "attachmentId" TEXT,
  "sourceChecksumSha256" TEXT NOT NULL,
  "destinationObjectKey" TEXT,
  "destChecksumSha256" TEXT,
  "status" "MigrationStatus" NOT NULL DEFAULT 'PENDING'::"MigrationStatus",
  "errorMessage" TEXT,
  "migratedAt" TIMESTAMP WITHOUT TIME ZONE,
  "verifiedAt" TIMESTAMP WITHOUT TIME ZONE,
  "cutoverAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "StorageMigrationLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StorageUploadLog" (
  "id" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" BIGINT NOT NULL,
  "checksumSha256" TEXT NOT NULL,
  "status" "UploadStatus" NOT NULL DEFAULT 'PENDING'::"UploadStatus",
  "uploadedBy" TEXT NOT NULL,
  "fileAttachmentId" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "committedAt" TIMESTAMP WITHOUT TIME ZONE,
  "abortedAt" TIMESTAMP WITHOUT TIME ZONE,
  "error" TEXT,
  CONSTRAINT "StorageUploadLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Student" (
  "id" TEXT NOT NULL,
  "studentCode" TEXT NOT NULL,
  "nationalId" TEXT,
  "title" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "nickname" TEXT,
  "gender" "StudentGender" NOT NULL DEFAULT 'MALE'::"StudentGender",
  "birthDate" TIMESTAMP WITHOUT TIME ZONE,
  "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE'::"StudentStatus",
  "homeAddress" TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  "deletedAt" TIMESTAMP WITHOUT TIME ZONE,
  "deletedById" TEXT,
  "deletionReason" "StudentDecommissionReason",
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentAffairsAttachment" (
  "id" TEXT NOT NULL,
  "entityType" "AttachmentEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "category" "AttachmentCategory" NOT NULL DEFAULT 'HOME_VISIT_FAMILY'::"AttachmentCategory",
  "storageKey" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteSize" BIGINT NOT NULL,
  "objectVersion" TEXT NOT NULL DEFAULT 'v1'::text,
  "imageWidth" INTEGER,
  "imageHeight" INTEGER,
  "uploadedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedById" TEXT NOT NULL,
  "retentionUntil" TIMESTAMP WITHOUT TIME ZONE,
  "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
  "isTombstoned" BOOLEAN NOT NULL DEFAULT false,
  "tombstonedAt" TIMESTAMP WITHOUT TIME ZONE,
  "tombstonedById" TEXT,
  "tombstoneReason" TEXT,
  CONSTRAINT "StudentAffairsAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentAffairsAuditLog" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actionVersion" TEXT NOT NULL DEFAULT '1.0'::text,
  "actorId" TEXT NOT NULL,
  "actorIdSnapshot" TEXT NOT NULL,
  "actorRoleSnapshot" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "requestId" TEXT,
  "source" TEXT NOT NULL,
  "beforeHash" TEXT,
  "afterHash" TEXT,
  "payload" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentAffairsAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentEnrollment" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "classRoomId" TEXT NOT NULL,
  "gradeLevel" INTEGER NOT NULL,
  "roomNumber" INTEGER NOT NULL,
  "rollNumber" INTEGER NOT NULL,
  "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED'::"EnrollmentStatus",
  "advisorId" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentHomeVisit" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "visitRound" INTEGER NOT NULL DEFAULT 1,
  "visitDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "guardianIncomeMonth" NUMERIC,
  "dependentCount" INTEGER NOT NULL DEFAULT 0,
  "houseCondition" TEXT,
  "roofMaterial" TEXT,
  "wallMaterial" TEXT,
  "floorMaterial" TEXT,
  "waterSource" TEXT,
  "toiletType" TEXT,
  "electricitySource" TEXT,
  "hasCar" BOOLEAN NOT NULL DEFAULT false,
  "hasMotorcycle" BOOLEAN NOT NULL DEFAULT false,
  "hasAirConditioner" BOOLEAN NOT NULL DEFAULT false,
  "agriculturalLandRai" DOUBLE PRECISION DEFAULT 0,
  "distanceKm" DOUBLE PRECISION,
  "commuteMethod" TEXT,
  "commuteCostPerDay" NUMERIC,
  "cctEstimatedPoverty" "CctPovertyLevel" NOT NULL DEFAULT 'NOT_POOR'::"CctPovertyLevel",
  "cctPmtScore" DOUBLE PRECISION,
  "visitorTeacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "StudentHomeVisit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentInterventionCase" (
  "id" TEXT NOT NULL,
  "caseNumber" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM'::"CasePriority",
  "status" "CaseStatus" NOT NULL DEFAULT 'OPEN'::"CaseStatus",
  "triggerReason" TEXT NOT NULL,
  "actionPlan" TEXT NOT NULL,
  "targetOutcome" TEXT NOT NULL,
  "dueDate" TIMESTAMP WITHOUT TIME ZONE,
  "assignedToId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "outcome" "CaseOutcome" NOT NULL DEFAULT 'PENDING'::"CaseOutcome",
  "outcomeNotes" TEXT,
  "resolvedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "StudentInterventionCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentMedicalCertificate" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "hospitalName" TEXT NOT NULL,
  "diagnosis" TEXT,
  "storageKey" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "byteSize" BIGINT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedById" TEXT,
  "verifiedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentMedicalCertificate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentMeritNomination" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "awardCategory" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "meritPointsScore" INTEGER NOT NULL,
  "status" "NominationStatus" NOT NULL DEFAULT 'PENDING_REVIEW'::"NominationStatus",
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP WITHOUT TIME ZONE,
  "rejectionReason" TEXT,
  "decisionNotes" TEXT,
  "certificateItemId" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentMeritNomination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentMorningAttendance" (
  "id" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "businessDate" DATE NOT NULL,
  "recordedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "StudentAttendanceStatus" NOT NULL DEFAULT 'PRESENT'::"StudentAttendanceStatus",
  "medicalCertId" TEXT,
  "remarks" TEXT,
  "recordedById" TEXT NOT NULL,
  CONSTRAINT "StudentMorningAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentPeriodAttendance" (
  "id" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "scheduledSessionId" TEXT NOT NULL,
  "status" "StudentAttendanceStatus" NOT NULL DEFAULT 'PRESENT'::"StudentAttendanceStatus",
  "exemptionStatus" "AttendanceExemptionStatus" NOT NULL DEFAULT 'NONE'::"AttendanceExemptionStatus",
  "medicalCertId" TEXT,
  "remarks" TEXT,
  "recordedById" TEXT NOT NULL,
  "recordedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentPeriodAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentRiskAssessment" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "evaluationCycle" TEXT NOT NULL,
  "riskLevel" "RiskLevel" NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "signalsJson" JSONB NOT NULL,
  "explanationJson" JSONB NOT NULL,
  "calculatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "triggeredCaseId" TEXT,
  CONSTRAINT "StudentRiskAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentSdqEvaluation" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "evaluatorType" "EvaluatorType" NOT NULL,
  "normRegistryId" TEXT NOT NULL,
  "emotionalScore" INTEGER NOT NULL,
  "conductScore" INTEGER NOT NULL,
  "hyperactivityScore" INTEGER NOT NULL,
  "peerProblemScore" INTEGER NOT NULL,
  "prosocialScore" INTEGER NOT NULL,
  "totalDifficulties" INTEGER NOT NULL,
  "overallLevel" "SdqLevel" NOT NULL,
  "rawAnswersJson" JSONB NOT NULL,
  "evaluatorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentSdqEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentStatusHistory" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "fromStatus" "StudentStatus" NOT NULL,
  "toStatus" "StudentStatus" NOT NULL,
  "effectiveDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "reason" TEXT NOT NULL,
  "changedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentYearlyBehaviorProjection" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "startingScore" INTEGER NOT NULL DEFAULT 100,
  "currentScore" INTEGER NOT NULL DEFAULT 100,
  "totalDemerit" INTEGER NOT NULL DEFAULT 0,
  "totalMerit" INTEGER NOT NULL DEFAULT 0,
  "recordCount" INTEGER NOT NULL DEFAULT 0,
  "lastCalculatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentYearlyBehaviorProjection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subject" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "credits" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "departmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubjectOffering" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "classRoomId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "SubjectOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubstituteWorkflow" (
  "id" TEXT NOT NULL,
  "leaveRequestId" TEXT NOT NULL,
  "timetableSlotId" TEXT NOT NULL,
  "date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "assignedTeacherId" TEXT NOT NULL,
  "assignedBy" TEXT NOT NULL,
  "status" "SubstituteWorkflowStatus" NOT NULL DEFAULT 'ASSIGNED'::"SubstituteWorkflowStatus",
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "SubstituteWorkflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupervisionAuditLog" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "actionBy" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupervisionAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupervisionSession" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "subjectCode" TEXT NOT NULL,
  "subjectName" TEXT NOT NULL,
  "gradeLevel" TEXT NOT NULL,
  "departmentGroup" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "periodNumber" INTEGER NOT NULL,
  "scheduledDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "teacherId" TEXT NOT NULL,
  "teacherName" TEXT NOT NULL,
  "supervisorId" TEXT NOT NULL,
  "supervisorName" TEXT NOT NULL,
  "type" "SupervisionType" NOT NULL DEFAULT 'ON_SITE'::"SupervisionType",
  "lessonPlanUrl" TEXT,
  "videoUrl" TEXT,
  "rubricScores" JSONB,
  "totalScore" DOUBLE PRECISION,
  "supervisorComment" TEXT,
  "teacherReflection" TEXT,
  "directorSignedBy" TEXT,
  "directorSignedAt" TIMESTAMP WITHOUT TIME ZONE,
  "directorComment" TEXT,
  "status" "SupervisionStatus" NOT NULL DEFAULT 'SCHEDULED'::"SupervisionStatus",
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "SupervisionSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemBackup" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemBackup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemLog" (
  "id" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "subsystem" TEXT NOT NULL DEFAULT 'LEAVE'::text,
  "description" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemLogArchive" (
  "id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "batchName" TEXT NOT NULL,
  "logCount" INTEGER NOT NULL DEFAULT 0,
  "logsData" JSONB NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemLogArchive_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemSettings" (
  "id" TEXT NOT NULL DEFAULT 'default'::text,
  "schoolName" TEXT NOT NULL DEFAULT 'ชื่อโรงเรียน'::text,
  "subheader" TEXT NOT NULL DEFAULT 'ระบบจัดการการลา'::text,
  "logoUrl" TEXT,
  "footerText" TEXT NOT NULL DEFAULT '© 2026 ระบบการลา'::text,
  "developerSecret" TEXT NOT NULL DEFAULT 'admin1234'::text,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "lineChannelAccessToken" TEXT,
  "lineTargetGroupId" TEXT,
  "leaveRules" TEXT NOT NULL DEFAULT 'การลากิจต้องยื่นคำขอล่วงหน้าอย่างน้อย 3 วันทำการ
การลาป่วยติดต่อกันเกิน 3 วัน ต้องแนบใบรับรองแพทย์
ระบบจะส่งแจ้งเตือนให้หัวหน้าหมวดของท่านพิจารณาเป็นลำดับแรก'::text,
  "requirePersonalAdvance" BOOLEAN NOT NULL DEFAULT true,
  "memoThresholdDays" INTEGER NOT NULL DEFAULT 15,
  "memoThresholdTimes" INTEGER NOT NULL DEFAULT 6,
  "recycleBinRetentionDays" INTEGER NOT NULL DEFAULT 30,
  "defaultInspectorId" TEXT,
  "affiliation" TEXT NOT NULL DEFAULT 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี'::text,
  "actingDirectorTitle" TEXT NOT NULL DEFAULT 'รักษาการในตำแหน่งผู้อำนวยการโรงเรียน'::text,
  "finalApproverUserIds" TEXT NOT NULL DEFAULT ''::text,
  "documentAdminUserIds" TEXT NOT NULL DEFAULT ''::text,
  "showActingDirectorTitle" BOOLEAN NOT NULL DEFAULT true,
  "enableLineNotify" BOOLEAN NOT NULL DEFAULT true,
  "googleDriveFormat" TEXT NOT NULL DEFAULT 'PDF'::text,
  "pdfFont" TEXT NOT NULL DEFAULT 'Prompt'::text,
  "lastLeaveMode" TEXT NOT NULL DEFAULT 'SAME'::text,
  "quotaExceededAction" TEXT NOT NULL DEFAULT 'ALLOW_WITH_MEMO'::text,
  "rolePermissions" TEXT NOT NULL DEFAULT '{"calendar":["ADMIN","DIRECTOR","HR","INSPECTOR","TEACHER"],"reports":["ADMIN","DIRECTOR","HR","INSPECTOR"],"approvals":["ADMIN","DIRECTOR","HR","INSPECTOR"],"logs":["ADMIN"],"backups":["ADMIN"],"users":["ADMIN"],"settings":["ADMIN"]}'::text,
  "attendanceLatitude" DOUBLE PRECISION,
  "attendanceLongitude" DOUBLE PRECISION,
  "attendanceRadius" DOUBLE PRECISION,
  "enableAdvancedKPI" BOOLEAN NOT NULL DEFAULT true,
  "enableAttendance" BOOLEAN NOT NULL DEFAULT false,
  "faceMatchThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
  "photoRetentionDays" INTEGER,
  "requireFaceScan" BOOLEAN NOT NULL DEFAULT false,
  "requireGeofence" BOOLEAN NOT NULL DEFAULT false,
  "requireLivenessCheck" BOOLEAN NOT NULL DEFAULT false,
  "enableDocument" BOOLEAN NOT NULL DEFAULT false,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok'::text,
  "iappApiKey" TEXT NOT NULL DEFAULT ''::text,
  "googleDriveFolderId" TEXT,
  "googleDriveSecret" TEXT,
  "googleDriveUploadUrl" TEXT,
  "enableAutoPdfOnApproval" BOOLEAN NOT NULL DEFAULT false,
  "googleAppsScriptId" TEXT,
  "enableRepair" BOOLEAN NOT NULL DEFAULT false,
  "enableRepairLineNotify" BOOLEAN NOT NULL DEFAULT true,
  "repairLineChannelAccessToken" TEXT,
  "repairLineTargetGroupId" TEXT,
  "enableLeave" BOOLEAN NOT NULL DEFAULT true,
  "enableTimetable" BOOLEAN NOT NULL DEFAULT true,
  "enableSubstitute" BOOLEAN NOT NULL DEFAULT true,
  "enableSupervision" BOOLEAN NOT NULL DEFAULT true,
  "enableExam" BOOLEAN NOT NULL DEFAULT true,
  "enableCompetency" BOOLEAN NOT NULL DEFAULT true,
  "enableFacility" BOOLEAN NOT NULL DEFAULT true,
  "enableAcademicSettings" BOOLEAN NOT NULL DEFAULT true,
  "enableAmssSync" BOOLEAN NOT NULL DEFAULT true,
  "enableCertificate" BOOLEAN NOT NULL DEFAULT true,
  "enableBudget" BOOLEAN NOT NULL DEFAULT false,
  "budgetAdminUserIds" TEXT NOT NULL DEFAULT ''::text,
  "enableStudentAffairs" BOOLEAN NOT NULL DEFAULT false,
  "enableStudentCouncil" BOOLEAN NOT NULL DEFAULT false,
  "enableAcademicPlanning" BOOLEAN NOT NULL DEFAULT false,
  "academicPlanningAllowedUserIds" TEXT NOT NULL DEFAULT ''::text,
  "documentManageMode" TEXT NOT NULL DEFAULT 'DIRECT'::text,
  "timetablePeriodsPerDay" INTEGER NOT NULL DEFAULT 8,
  "timetableStartTime" TEXT NOT NULL DEFAULT '08:30'::text,
  "timetablePeriodDuration" INTEGER NOT NULL DEFAULT 50,
  "substitutePolicy" TEXT NOT NULL DEFAULT 'DEPARTMENT'::text,
  "substituteWorkloadPenalty" INTEGER NOT NULL DEFAULT 10,
  "enableSubstituteLineNotify" BOOLEAN NOT NULL DEFAULT true,
  "supervisionMinPerTerm" INTEGER NOT NULL DEFAULT 2,
  "supervisionDirectorRatio" INTEGER NOT NULL DEFAULT 40,
  "supervisionDeptRatio" INTEGER NOT NULL DEFAULT 40,
  "supervisionSelfRatio" INTEGER NOT NULL DEFAULT 20,
  CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Teacher" (
  "id" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "prefix" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "maxWeeklyPeriods" INTEGER NOT NULL DEFAULT 20,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimetableSlot" (
  "id" TEXT NOT NULL,
  "timetableVersionId" TEXT NOT NULL,
  "offeringId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "periodNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimetableVersion" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "versionName" TEXT NOT NULL,
  "status" "TimetableVersionStatus" NOT NULL DEFAULT 'DRAFT'::"TimetableVersionStatus",
  "isCurrentPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "TimetableVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'TEACHER'::text,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "lineUserId" TEXT,
  "position" TEXT,
  "subjectGroup" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "signatureUrl" TEXT,
  "hasSignature" BOOLEAN NOT NULL DEFAULT false,
  "username" TEXT,
  "address" TEXT,
  "phoneNumber" TEXT,
  "level" TEXT,
  "bypassAttendance" BOOLEAN NOT NULL DEFAULT false,
  "faceConsent" BOOLEAN NOT NULL DEFAULT false,
  "faceConsentAt" TIMESTAMP WITHOUT TIME ZONE,
  "faceDescriptor" JSONB,
  "faceProfileUrl" TEXT,
  "workShiftId" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserDutyAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dutyType" "DutyType" NOT NULL,
  "divisionScope" "ScopeDivision",
  "departmentScope" "ScopeDepartment",
  "assignedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP WITHOUT TIME ZONE,
  "assignedById" TEXT,
  CONSTRAINT "UserDutyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleProfile" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "licensePlate" TEXT NOT NULL,
  "brand" TEXT,
  "model" TEXT,
  "fuelType" TEXT NOT NULL DEFAULT 'DIESEL'::text,
  "seatCapacity" INTEGER NOT NULL DEFAULT 12,
  "currentOdometer" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "VehicleProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleReservationDetail" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "missionType" "VehicleMissionType" NOT NULL DEFAULT 'OFFICIAL_MEETING'::"VehicleMissionType",
  "origin" TEXT NOT NULL DEFAULT 'โรงเรียนกุดจับประชาสรรค์'::text,
  "destination" TEXT NOT NULL,
  "teacherCount" INTEGER NOT NULL DEFAULT 1,
  "studentCount" INTEGER NOT NULL DEFAULT 0,
  "passengerListNotes" TEXT,
  "driverAssignedAt" TIMESTAMP WITHOUT TIME ZONE,
  "startMileage" DOUBLE PRECISION,
  "endMileage" DOUBLE PRECISION,
  "fuelCost" DOUBLE PRECISION,
  "tripNotes" TEXT,
  CONSTRAINT "VehicleReservationDetail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkShift" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "lateThreshold" INTEGER NOT NULL,
  "earlyOutThreshold" INTEGER NOT NULL,
  "isOvernight" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT "WorkShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kps_cloud_store" (
  "key" TEXT NOT NULL,
  "data" JSONB,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT "kps_cloud_store_pkey" PRIMARY KEY ("key")
);

-- ---------------------------------------------------------------------
-- 3. FOREIGN KEY CONSTRAINTS (158)
-- ---------------------------------------------------------------------

ALTER TABLE "AMSSCredentials" ADD CONSTRAINT "AMSSCredentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "AcademicCalendar" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ActivityExpense" ADD CONSTRAINT "ActivityExpense_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "ActivityTrancheAllocation" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ActivityExpense" ADD CONSTRAINT "ActivityExpense_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ActivityExpense" ADD CONSTRAINT "ActivityExpense_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ActivityTrancheAllocation" ADD CONSTRAINT "ActivityTrancheAllocation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ActivityTrancheAllocation" ADD CONSTRAINT "ActivityTrancheAllocation_budgetTrancheId_fkey" FOREIGN KEY ("budgetTrancheId") REFERENCES "BudgetTranche" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ApprovalStage" ADD CONSTRAINT "ApprovalStage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_planningSessionId_fkey" FOREIGN KEY ("planningSessionId") REFERENCES "PlanningSession" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "WorkShift" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "AttendanceNonce" ADD CONSTRAINT "AttendanceNonce_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "AttendancePhoto" ADD CONSTRAINT "AttendancePhoto_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "BehaviorRecord" ADD CONSTRAINT "BehaviorRecord_correctionForId_fkey" FOREIGN KEY ("correctionForId") REFERENCES "BehaviorRecord" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BehaviorRecord" ADD CONSTRAINT "BehaviorRecord_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BehaviorRecord" ADD CONSTRAINT "BehaviorRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetReceipt" ADD CONSTRAINT "BudgetReceipt_budgetTrancheId_fkey" FOREIGN KEY ("budgetTrancheId") REFERENCES "BudgetTranche" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetReceipt" ADD CONSTRAINT "BudgetReceipt_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetSource" ADD CONSTRAINT "BudgetSource_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetTranche" ADD CONSTRAINT "BudgetTranche_budgetSourceId_fkey" FOREIGN KEY ("budgetSourceId") REFERENCES "BudgetSource" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetTransfer" ADD CONSTRAINT "BudgetTransfer_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetTransfer" ADD CONSTRAINT "BudgetTransfer_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetTransfer" ADD CONSTRAINT "BudgetTransfer_fromAllocationId_fkey" FOREIGN KEY ("fromAllocationId") REFERENCES "ActivityTrancheAllocation" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetTransfer" ADD CONSTRAINT "BudgetTransfer_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "BudgetTransfer" ADD CONSTRAINT "BudgetTransfer_toAllocationId_fkey" FOREIGN KEY ("toAllocationId") REFERENCES "ActivityTrancheAllocation" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "CctExportManifest" ADD CONSTRAINT "CctExportManifest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "CctExportManifest" ADD CONSTRAINT "CctExportManifest_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "CertificateIssuedItem" ADD CONSTRAINT "CertificateIssuedItem_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "DocumentRecord" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_backgroundAttachmentId_fkey" FOREIGN KEY ("backgroundAttachmentId") REFERENCES "FileAttachment" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "CompetencyEvaluation" ADD CONSTRAINT "CompetencyEvaluation_paAgreementId_fkey" FOREIGN KEY ("paAgreementId") REFERENCES "PaAgreement" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "ProcessingPurpose" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentConfig" ADD CONSTRAINT "DocumentConfig_memoSectionId_fkey" FOREIGN KEY ("memoSectionId") REFERENCES "MemoSection" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_memoSectionId_fkey" FOREIGN KEY ("memoSectionId") REFERENCES "MemoSection" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "DocumentRecord" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "DocumentRecord" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentRouting" ADD CONSTRAINT "DocumentRouting_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentRouting" ADD CONSTRAINT "DocumentRouting_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentRouting" ADD CONSTRAINT "DocumentRouting_incomingDocId_fkey" FOREIGN KEY ("incomingDocId") REFERENCES "IncomingDocument" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_memoSectionId_fkey" FOREIGN KEY ("memoSectionId") REFERENCES "MemoSection" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamAnswerKey" ADD CONSTRAINT "ExamAnswerKey_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "ExamPaper" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamAnswerKeyItem" ADD CONSTRAINT "ExamAnswerKeyItem_answerKeyId_fkey" FOREIGN KEY ("answerKeyId") REFERENCES "ExamAnswerKey" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamAnswerKeyVersion" ADD CONSTRAINT "ExamAnswerKeyVersion_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExamAnswerKeyVersion" ADD CONSTRAINT "ExamAnswerKeyVersion_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "ExamPaper" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamItemOverride" ADD CONSTRAINT "ExamItemOverride_submissionItemId_fkey" FOREIGN KEY ("submissionItemId") REFERENCES "ExamItemSubmission" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExamItemSubmission" ADD CONSTRAINT "ExamItemSubmission_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExamSubmission" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExamTemplate" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExamPrintedSheet" ADD CONSTRAINT "ExamPrintedSheet_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "ExamPaper" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExamProctorAssignment" ADD CONSTRAINT "ExamProctorAssignment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ExamSubjectSlot" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamRegradeJob" ADD CONSTRAINT "ExamRegradeJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "ExamRegradeJob" ADD CONSTRAINT "ExamRegradeJob_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "ExamPaper" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamRegradeJob" ADD CONSTRAINT "ExamRegradeJob_targetKeyVersionId_fkey" FOREIGN KEY ("targetKeyVersionId") REFERENCES "ExamAnswerKeyVersion" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamSubjectSlot" ADD CONSTRAINT "ExamSubjectSlot_examPeriodId_fkey" FOREIGN KEY ("examPeriodId") REFERENCES "ExamPeriod" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamSubjectiveItem" ADD CONSTRAINT "ExamSubjectiveItem_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "ExamPaper" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "ExamPaper" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_gradingVersionId_fkey" FOREIGN KEY ("gradingVersionId") REFERENCES "ExamAnswerKeyVersion" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExpenseAttachment" ADD CONSTRAINT "ExpenseAttachment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ActivityExpense" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ExpenseAttachment" ADD CONSTRAINT "ExpenseAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExpenseReversal" ADD CONSTRAINT "ExpenseReversal_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExpenseReversal" ADD CONSTRAINT "ExpenseReversal_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ExpenseReversal" ADD CONSTRAINT "ExpenseReversal_originalExpenseId_fkey" FOREIGN KEY ("originalExpenseId") REFERENCES "ActivityExpense" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "FacilityApprovalStep" ADD CONSTRAINT "FacilityApprovalStep_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "FacilityApprovalStep" ADD CONSTRAINT "FacilityApprovalStep_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "FacilityReservation" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "FacilityPostMissionReport" ADD CONSTRAINT "FacilityPostMissionReport_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "FacilityReservation" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "FacilityReservation" ADD CONSTRAINT "FacilityReservation_reservedByUserId_fkey" FOREIGN KEY ("reservedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "FacilityReservation" ADD CONSTRAINT "FacilityReservation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "FacilityResource" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "FacilityReservationRevision" ADD CONSTRAINT "FacilityReservationRevision_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "FacilityReservation" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_documentRecordId_fkey" FOREIGN KEY ("documentRecordId") REFERENCES "DocumentRecord" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_incomingDocumentId_fkey" FOREIGN KEY ("incomingDocumentId") REFERENCES "IncomingDocument" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_systemSettingsId_fkey" FOREIGN KEY ("systemSettingsId") REFERENCES "SystemSettings" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "IncomingDocument" ADD CONSTRAINT "IncomingDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "IncomingDocument" ADD CONSTRAINT "IncomingDocument_memoSectionId_fkey" FOREIGN KEY ("memoSectionId") REFERENCES "MemoSection" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "InterventionActivity" ADD CONSTRAINT "InterventionActivity_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "StudentInterventionCase" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "InterventionActivity" ADD CONSTRAINT "InterventionActivity_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_policyDocumentId_fkey" FOREIGN KEY ("policyDocumentId") REFERENCES "PolicyDocument" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ProcessingDataCategoryPolicy" ADD CONSTRAINT "ProcessingDataCategoryPolicy_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "ProcessingPurpose" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ProcessingPurpose" ADD CONSTRAINT "ProcessingPurpose_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProcessingActivity" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_budgetSourceId_fkey" FOREIGN KEY ("budgetSourceId") REFERENCES "BudgetSource" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Project" ADD CONSTRAINT "Project_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Project" ADD CONSTRAINT "Project_leaderUserId_fkey" FOREIGN KEY ("leaderUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ProjectAttachment" ADD CONSTRAINT "ProjectAttachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ProjectAttachment" ADD CONSTRAINT "ProjectAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "RecommendationRun" ADD CONSTRAINT "RecommendationRun_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "RepairPhoto" ADD CONSTRAINT "RepairPhoto_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "RepairRequest" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "RepairPhoto" ADD CONSTRAINT "RepairPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "FacilityReservation" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "FacilityResource" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ResourceReservation" ADD CONSTRAINT "ResourceReservation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ResourceItem" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "RoomProfile" ADD CONSTRAINT "RoomProfile_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "FacilityResource" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "RoomReservationDetail" ADD CONSTRAINT "RoomReservationDetail_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "FacilityReservation" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ScheduledClassSession" ADD CONSTRAINT "ScheduledClassSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ScheduledClassSession" ADD CONSTRAINT "ScheduledClassSession_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "SubjectOffering" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "StorageUploadLog" ADD CONSTRAINT "StorageUploadLog_fileAttachmentId_fkey" FOREIGN KEY ("fileAttachmentId") REFERENCES "FileAttachment" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Student" ADD CONSTRAINT "Student_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentHomeVisit" ADD CONSTRAINT "StudentHomeVisit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentHomeVisit" ADD CONSTRAINT "StudentHomeVisit_visitorTeacherId_fkey" FOREIGN KEY ("visitorTeacherId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentInterventionCase" ADD CONSTRAINT "StudentInterventionCase_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentInterventionCase" ADD CONSTRAINT "StudentInterventionCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentInterventionCase" ADD CONSTRAINT "StudentInterventionCase_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMedicalCertificate" ADD CONSTRAINT "StudentMedicalCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMedicalCertificate" ADD CONSTRAINT "StudentMedicalCertificate_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMeritNomination" ADD CONSTRAINT "StudentMeritNomination_certificateItemId_fkey" FOREIGN KEY ("certificateItemId") REFERENCES "CertificateIssuedItem" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMeritNomination" ADD CONSTRAINT "StudentMeritNomination_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMeritNomination" ADD CONSTRAINT "StudentMeritNomination_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMorningAttendance" ADD CONSTRAINT "StudentMorningAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMorningAttendance" ADD CONSTRAINT "StudentMorningAttendance_medicalCertId_fkey" FOREIGN KEY ("medicalCertId") REFERENCES "StudentMedicalCertificate" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentMorningAttendance" ADD CONSTRAINT "StudentMorningAttendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentPeriodAttendance" ADD CONSTRAINT "StudentPeriodAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentPeriodAttendance" ADD CONSTRAINT "StudentPeriodAttendance_medicalCertId_fkey" FOREIGN KEY ("medicalCertId") REFERENCES "StudentMedicalCertificate" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentPeriodAttendance" ADD CONSTRAINT "StudentPeriodAttendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentPeriodAttendance" ADD CONSTRAINT "StudentPeriodAttendance_scheduledSessionId_fkey" FOREIGN KEY ("scheduledSessionId") REFERENCES "ScheduledClassSession" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentRiskAssessment" ADD CONSTRAINT "StudentRiskAssessment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentRiskAssessment" ADD CONSTRAINT "StudentRiskAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentRiskAssessment" ADD CONSTRAINT "StudentRiskAssessment_triggeredCaseId_fkey" FOREIGN KEY ("triggeredCaseId") REFERENCES "StudentInterventionCase" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentSdqEvaluation" ADD CONSTRAINT "StudentSdqEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentSdqEvaluation" ADD CONSTRAINT "StudentSdqEvaluation_normRegistryId_fkey" FOREIGN KEY ("normRegistryId") REFERENCES "SdqNormsRegistry" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentSdqEvaluation" ADD CONSTRAINT "StudentSdqEvaluation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StudentYearlyBehaviorProjection" ADD CONSTRAINT "StudentYearlyBehaviorProjection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "SubjectOffering" ADD CONSTRAINT "SubjectOffering_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "SubjectOffering" ADD CONSTRAINT "SubjectOffering_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "SubjectOffering" ADD CONSTRAINT "SubjectOffering_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "SupervisionAuditLog" ADD CONSTRAINT "SupervisionAuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SupervisionSession" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "SubjectOffering" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableVersionId_fkey" FOREIGN KEY ("timetableVersionId") REFERENCES "TimetableVersion" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "WorkShift" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "UserDutyAssignment" ADD CONSTRAINT "UserDutyAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "UserDutyAssignment" ADD CONSTRAINT "UserDutyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "VehicleProfile" ADD CONSTRAINT "VehicleProfile_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "FacilityResource" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "VehicleReservationDetail" ADD CONSTRAINT "VehicleReservationDetail_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "FacilityReservation" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 4. SQL VIEWS (2)
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW "classrooms" AS
 SELECT cr.id,
    cr.name,
    ('ม.'::text || (cr."gradeLevel")::text) AS level,
    cr."gradeLevel" AS grade_level,
    cr."roomNumber" AS room_number,
    cr.name AS room_name,
    COALESCE(cr.adviser, 'ครูประจำชั้น'::text) AS adviser,
    COALESCE(cr.status, 'ACTIVE'::text) AS status,
    (count(se.id))::integer AS student_count,
    cr."createdAt" AS created_at,
    cr."updatedAt" AS updated_at
   FROM ("ClassRoom" cr
     LEFT JOIN "StudentEnrollment" se ON (((se."classRoomId" = cr.id) AND (se.status = 'ENROLLED'::"EnrollmentStatus"))))
  GROUP BY cr.id, cr.name, cr."gradeLevel", cr."roomNumber", cr.adviser, cr.status, cr."createdAt", cr."updatedAt"
  ORDER BY cr."gradeLevel", cr."roomNumber";;

CREATE OR REPLACE VIEW "students" AS
 SELECT s.id,
    s."studentCode",
    s."studentCode" AS code,
    TRIM(BOTH FROM concat(COALESCE(s.title, ''::text), ' ', s."firstName", ' ', s."lastName")) AS name,
    s.title,
    s."firstName" AS first_name,
    s."lastName" AS last_name,
    s.gender,
    s.status,
    se."classRoomId" AS classroom_id,
    se."rollNumber" AS seat_no,
    s."createdAt" AS created_at,
    s."updatedAt" AS updated_at
   FROM ("Student" s
     LEFT JOIN "StudentEnrollment" se ON ((se."studentId" = s.id)));;

-- Composite indexes optimizing StudentEnrollment joins in classrooms and students views
CREATE INDEX IF NOT EXISTS "idx_student_enrollment_classroom_status"
ON "StudentEnrollment" ("classRoomId", "status");

CREATE INDEX IF NOT EXISTS "idx_student_enrollment_student_id"
ON "StudentEnrollment" ("studentId");

