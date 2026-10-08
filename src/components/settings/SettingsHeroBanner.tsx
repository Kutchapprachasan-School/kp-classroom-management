import React from 'react';
import { Settings } from 'lucide-react';
import { PageHeroBanner } from '../layout/PageHeroBanner';

interface SettingsHeroBannerProps {
  schoolName?: string;
}

export const SettingsHeroBanner: React.FC<SettingsHeroBannerProps> = ({
  schoolName = 'โรงเรียนกุดจับประชาสรรค์',
}) => {
  return (
    <PageHeroBanner
      title="ตั้งค่าระบบ"
      subtitle={`จัดการข้อมูลพื้นฐาน โครงสร้างเวลาเรียน และการตั้งค่าระบบ ${schoolName}`}
      icon={<Settings className="w-6 h-6 text-white" />}
      iconBgClass="bg-blue-600 text-white"
      badgeText="System Settings"
      tagText="⚙️ ข้อมูลโรงเรียน • ปฏิทินกำหนดการ • เวลาเรียนและเข้าแถว • ระบบการลา • สำรองข้อมูล R2"
      quoteLines={[
        'การตั้งค่าที่ถูกต้อง',
        'ช่วยให้การทำงานราบรื่น',
        'บริหารจัดการง่ายดาย',
      ]}
    />
  );
};
