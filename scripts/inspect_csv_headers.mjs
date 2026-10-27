import fs from 'node:fs';

const lines = fs.readFileSync('scratch/official_roster_user.csv', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('ห้องที่') || l.includes('ชั้น')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
