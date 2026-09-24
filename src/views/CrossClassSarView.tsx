import React from 'react';
import { SarSummaryBanner } from '../components/teacher/SarSummaryBanner';
import { SarCoursesTable } from '../components/teacher/SarCoursesTable';
import { SarGradeMatrixTable } from '../components/teacher/SarGradeMatrixTable';
import { sarCourseSummaries, sarGradeMatrixRows } from '../data/mockData';

export const CrossClassSarView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* 1. SAR / PA Target Achievement Banner */}
      <SarSummaryBanner
        passPercentage={84.8}
        passedCount={234}
        totalStudents={276}
        courseCount={4}
      />

      {/* 2. Course-level Performance Comparison Table */}
      <SarCoursesTable
        courses={sarCourseSummaries}
        totalStudents={276}
        totalPassedCount={234}
        overallPassPercentage={84.8}
      />

      {/* 3. Detailed Grade Distribution Matrix */}
      <SarGradeMatrixTable rows={sarGradeMatrixRows} />
    </div>
  );
};
