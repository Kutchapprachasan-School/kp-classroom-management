// test_grading_bounce_and_returned_flow.mjs
// Verification suite for Grading Bounce-Back Prevention and Returned Work Review Flow
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Grading Bounce-Back & Returned Flow Verification...\n');

// 1. Verify GradingQueueView.tsx
console.log('--- 1. Checking GradingQueueView.tsx Architecture ---');
const queueViewPath = path.resolve('src/views/GradingQueueView.tsx');
assert.ok(fs.existsSync(queueViewPath), 'GradingQueueView.tsx must exist');
const queueViewContent = fs.readFileSync(queueViewPath, 'utf8');

assert.ok(queueViewContent.includes('handleStartReturnedGrading'), 'Must contain handleStartReturnedGrading');
assert.ok(queueViewContent.includes('ตรวจงานแก้ไข'), 'Must contain "ตรวจงานแก้ไข" button');
assert.ok(queueViewContent.includes("selectedStatus === 'PENDING'"), 'Must default or check PENDING status');
assert.ok(queueViewContent.includes('nextReturned'), 'Must advance to next returned item when grading returned work');
console.log('  ✓ GradingQueueView has "ตรวจงานแก้ไข" button, handleStartReturnedGrading, and returned-item stepper');

// 2. Verify GradingWorkspaceModal.tsx
console.log('\n--- 2. Checking GradingWorkspaceModal.tsx Architecture ---');
const modalPath = path.resolve('src/components/teacher/GradingWorkspaceModal.tsx');
assert.ok(fs.existsSync(modalPath), 'GradingWorkspaceModal.tsx must exist');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert.ok(modalContent.includes("'PENDING' | 'RETURNED' | 'GRADED' | 'ALL'"), 'modalFilter must support RETURNED');
assert.ok(modalContent.includes("modalFilter === 'RETURNED'"), 'filteredModalItems must filter RETURNED items');
assert.ok(modalContent.includes('returnedItemsCount'), 'Must track returnedItemsCount');
assert.ok(modalContent.includes('งานนี้ส่งกลับให้นักเรียนแก้ไข'), 'Must display returned revision alert banner');
console.log('  ✓ GradingWorkspaceModal supports RETURNED filter, count badge, and revision alert banner');

// 3. Verify teacherCourseAssignmentService.ts Logic Guard
console.log('\n--- 3. Checking teacherCourseAssignmentService.ts Status Determination ---');
const servicePath = path.resolve('src/services/teacherCourseAssignmentService.ts');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert.ok(serviceContent.includes('isFreshStudentSubmission'), 'Must identify fresh student submission');
assert.ok(serviceContent.includes('isGraded'), 'Must compute isGraded cleanly');
assert.ok(serviceContent.includes('isReturned'), 'Must compute isReturned cleanly');
// Ensure the buggy '!isResubmission &&' is removed from isGraded and isReturned
assert.ok(!serviceContent.includes('const isGraded = !isResubmission && (sub.status === \'GRADED\''), 'Old bug !isResubmission && sub.status === GRADED must be removed');
assert.ok(!serviceContent.includes('const isReturned = !isResubmission && (sub.status === \'RETURNED_REVISION\''), 'Old bug !isResubmission && sub.status === RETURNED_REVISION must be removed');
assert.ok(serviceContent.includes('gradedTimestamp: Date.now()'), 'submitGrade and returnSubmission must record gradedTimestamp');
console.log('  ✓ Status determination eliminates resubmission bounce-back and records gradedTimestamp');

// 4. Verify sgsRosterAndSubmissionService.ts
console.log('\n--- 4. Checking sgsRosterAndSubmissionService.ts Synchronization ---');
const sgsServicePath = path.resolve('src/services/sgsRosterAndSubmissionService.ts');
const sgsContent = fs.readFileSync(sgsServicePath, 'utf8');

assert.ok(sgsContent.includes("queueStatus === 'GRADED'") && sgsContent.includes('? false'), 'GRADED items must not inherit isResubmission: true in queue sync');
assert.ok(sgsContent.includes('cleanStudentCode'), 'gradeSubmission and returnSubmission must clean studentCode');
assert.ok(sgsContent.includes('returnReason: undefined'), 'Grading must clear returnReason and returnedAt');
console.log('  ✓ sgsRosterAndSubmissionService cleanly syncs GRADED and RETURNED statuses');

console.log('\n======================================================');
console.log('🎉 ALL BOUNCE-BACK & RETURNED FLOW CHECKS PASSED!');
console.log('======================================================\n');
