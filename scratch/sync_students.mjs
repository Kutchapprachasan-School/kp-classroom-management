import { supabase } from '../src/lib/supabase.ts';
import { defaultStudents, mockStudentsByRoom } from '../src/services/studentService.ts';

async function syncAllStudents() {
  console.log('Syncing all students to Supabase Student table...');
  const allMap = new Map();

  for (const stu of defaultStudents) {
    allMap.set(stu.code, { ...stu, classroomId: 'room-3-1' });
  }

  for (const [room, list] of Object.entries(mockStudentsByRoom)) {
    for (const stu of list) {
      if (!allMap.has(stu.code)) {
        allMap.set(stu.code, { ...stu, classroomId: room });
      }
    }
  }

  console.log(`Found ${allMap.size} unique students to sync.`);

  for (const [code, stu] of allMap.entries()) {
    let title = 'ด.ช.';
    let firstName = stu.name;
    let lastName = '';
    const nameParts = stu.name.trim().split(/\s+/);
    if (nameParts[0].startsWith('ด.ช.') || nameParts[0].startsWith('เด็กชาย')) {
      title = 'ด.ช.';
      firstName = nameParts[0].replace(/^(ด\.ช\.|เด็กชาย)/, '') || nameParts[1] || '';
      lastName = nameParts.slice(1).join(' ').replace(firstName, '').trim();
    } else if (nameParts[0].startsWith('ด.ญ.') || nameParts[0].startsWith('เด็กหญิง')) {
      title = 'ด.ญ.';
      firstName = nameParts[0].replace(/^(ด\.ญ\.|เด็กหญิง)/, '') || nameParts[1] || '';
      lastName = nameParts.slice(1).join(' ').replace(firstName, '').trim();
    } else if (nameParts[0].startsWith('นาย')) {
      title = 'นาย';
      firstName = nameParts[0].replace(/^นาย/, '') || nameParts[1] || '';
      lastName = nameParts.slice(1).join(' ').replace(firstName, '').trim();
    } else if (nameParts[0].startsWith('น.ส.') || nameParts[0].startsWith('นางสาว')) {
      title = 'นางสาว';
      firstName = nameParts[0].replace(/^(น\.ส\.|นางสาว)/, '') || nameParts[1] || '';
      lastName = nameParts.slice(1).join(' ').replace(firstName, '').trim();
    } else if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    const gender = (title === 'ด.ญ.' || title === 'นางสาว' || stu.gender === 'FEMALE') ? 'FEMALE' : 'MALE';
    const studentId = `stu-${code}`;

    const { error } = await supabase.from('Student').upsert({
      id: studentId,
      studentCode: code,
      title,
      firstName: firstName || stu.name,
      lastName: lastName || '',
      gender,
      status: 'ACTIVE',
    }, { onConflict: 'id' });

    if (error) {
      console.warn(`Error syncing ${code} (${stu.name}):`, error.message);
    } else {
      console.log(`Synced ${code}: ${title}${firstName} ${lastName}`);
    }
  }

  // Check count in Supabase
  const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
  console.log(`\nTotal students in Supabase students view: ${count}`);
}

syncAllStudents().catch(console.error);
