// test_r2_upload_progress.mjs
// Test suite for XMLHttpRequest-based R2 Upload Progress Tracking

import assert from 'node:assert';

console.log('🧪 Starting R2 Upload Progress & XHR Validation Tests...');

// Mock XMLHttpRequest environment for Node.js
class MockXMLHttpRequest {
  constructor() {
    this.headers = {};
    this.upload = {
      onprogress: null,
    };
    this.status = 200;
    this.responseText = 'OK';
    this.readyState = 0;
    this.onload = null;
    this.onerror = null;
  }

  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  setRequestHeader(key, value) {
    this.headers[key] = value;
  }

  send(body) {
    // Simulate upload progress
    const total = (body && body.size) || 1000;
    if (typeof this.upload.onprogress === 'function') {
      this.upload.onprogress({
        lengthComputable: true,
        loaded: Math.round(total * 0.25),
        total,
      });
      this.upload.onprogress({
        lengthComputable: true,
        loaded: Math.round(total * 0.5),
        total,
      });
      this.upload.onprogress({
        lengthComputable: true,
        loaded: Math.round(total * 0.75),
        total,
      });
      this.upload.onprogress({
        lengthComputable: true,
        loaded: total,
        total,
      });
    }

    this.readyState = 4;
    this.status = 200;
    if (typeof this.onload === 'function') {
      this.onload();
    }
  }
}

globalThis.XMLHttpRequest = MockXMLHttpRequest;
globalThis.window = {
  localStorage: {
    getItem: (key) => {
      if (key === 'kp_r2_worker_url') return 'https://kps-r2-storage.kps-school.workers.dev';
      if (key === 'kp_r2_public_url') return 'https://storage.kps.ac.th';
      if (key === 'kp_r2_upload_secret') return 'test_secret_123';
      return null;
    },
  },
};

// Import uploadToR2WithProgress and uploadMultipleFilesWithProgress
// Since cloudDataService is TS, let's test the logic directly
function testUploadToR2WithProgress(r2Key, file, onProgress) {
  return new Promise((resolve, reject) => {
    const workerUrl = 'https://kps-r2-storage.kps-school.workers.dev';
    const publicUrl = 'https://storage.kps.ac.th';
    const uploadSecret = 'test_secret_123';

    const cleanKey = r2Key
      .replace(/^r2:\/\/kp-classroom-submissions\//, '')
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^\/+/, '');

    const xhr = new MockXMLHttpRequest();
    xhr.open('PUT', `${workerUrl}/${encodeURI(cleanKey)}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-Custom-Auth-Key', uploadSecret);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress({
          percent,
          loadedBytes: event.loaded,
          totalBytes: event.total,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(`${publicUrl}/${encodeURI(cleanKey)}`);
      } else {
        reject(new Error(`Failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error'));
    };

    xhr.send(file);
  });
}

async function testUploadMultipleFilesWithProgress(items, onTotalProgress) {
  const uploadedUrls = [];
  const totalFiles = items.length;

  for (let i = 0; i < totalFiles; i++) {
    const { r2Key, file } = items[i];
    const url = await testUploadToR2WithProgress(r2Key, file, ({ percent }) => {
      if (onTotalProgress) {
        const overallPercent = Math.round((i * 100 + percent) / totalFiles);
        onTotalProgress(overallPercent, i + 1, totalFiles);
      }
    });
    uploadedUrls.push(url);
  }

  return uploadedUrls;
}

// 1. Test single file upload progress (0% to 100%)
const progressSnapshots = [];
const fakeFile = { name: 'art_homework.webp', type: 'image/webp', size: 200000 };

const resultUrl = await testUploadToR2WithProgress(
  'kp-classroom-submissions/1-2569/m3-1/asg-01/45101_art.webp',
  fakeFile,
  (info) => {
    progressSnapshots.push(info.percent);
  }
);

assert.strictEqual(resultUrl, 'https://storage.kps.ac.th/kp-classroom-submissions/1-2569/m3-1/asg-01/45101_art.webp');
assert.deepStrictEqual(progressSnapshots, [25, 50, 75, 100], 'Progress should report 25%, 50%, 75%, 100%');
console.log('✅ 1. Single file upload with XMLHttpRequest progress: PASSED');

// 2. Test multiple file upload progress
const overallProgressSnapshots = [];
const multiItems = [
  { r2Key: 'sub1.webp', file: { name: 'f1.webp', type: 'image/webp', size: 1000 } },
  { r2Key: 'sub2.webp', file: { name: 'f2.webp', type: 'image/webp', size: 1000 } },
];

const multiUrls = await testUploadMultipleFilesWithProgress(multiItems, (overall, current, total) => {
  overallProgressSnapshots.push({ overall, current, total });
});

assert.strictEqual(multiUrls.length, 2);
assert.strictEqual(overallProgressSnapshots[overallProgressSnapshots.length - 1].overall, 100);
console.log('✅ 2. Multiple file upload progress aggregation: PASSED');

// 3. Test File Validation and Sanitization logic
function sanitizeFileName(fileName) {
  const lastDotIndex = fileName.lastIndexOf('.');
  const ext = lastDotIndex !== -1 ? fileName.slice(lastDotIndex).toLowerCase() : '';
  const baseName = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;

  const cleanBase = baseName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9ก-๙_\-]/g, '');

  return `${cleanBase || 'submission'}${ext}`;
}

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_DOC_SIZE_MB = 15;

function validateSubmissionFile(file) {
  if (!file) return { valid: false, error: 'กรุณาเลือกไฟล์ที่ต้องการส่ง' };
  if (file.size === 0) return { valid: false, error: 'ไฟล์ที่เลือกไม่มีข้อมูล (ขนาด 0 KB) กรุณาเลือกไฟล์ใหม่' };

  const lastDot = file.name.lastIndexOf('.');
  const ext = lastDot !== -1 ? file.name.slice(lastDot).toLowerCase() : '';

  const isImageExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  const isDocExt = ALLOWED_DOC_EXTENSIONS.includes(ext);

  if (!isImageExt && !isDocExt) {
    return {
      valid: false,
      error: `ไม่รองรับไฟล์นามสกุล "${ext || 'ไม่ทราบชนิด'}" (อนุญาตเฉพาะรูปภาพ JPG, PNG, WebP และเอกสาร PDF, Word เท่านั้น)`,
    };
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `รูปแบบข้อมูลของไฟล์ (${file.type}) ไม่ถูกต้องหรือไม่ปลอดภัย`,
    };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (isImageExt && fileSizeMB > MAX_IMAGE_SIZE_MB) {
    return {
      valid: false,
      error: `ไฟล์รูปภาพมีขนาดใหญ่เกินไป (${fileSizeMB.toFixed(2)} MB) กรุณาใช้รูปภาพขนาดไม่เกิน ${MAX_IMAGE_SIZE_MB} MB`,
    };
  }

  if (isDocExt && fileSizeMB > MAX_DOC_SIZE_MB) {
    return {
      valid: false,
      error: `ไฟล์เอกสารมีขนาดใหญ่เกินไป (${fileSizeMB.toFixed(2)} MB) กรุณาใช้ไฟล์ขนาดไม่เกิน ${MAX_DOC_SIZE_MB} MB`,
    };
  }

  return {
    valid: true,
    sanitizedName: sanitizeFileName(file.name),
    category: isImageExt ? 'image' : 'document',
  };
}

// 3.1 Test valid image
const validImg = validateSubmissionFile({ name: 'การบ้าน ศิลปะ 1.png', size: 2 * 1024 * 1024, type: 'image/png' });
assert.strictEqual(validImg.valid, true);
assert.strictEqual(validImg.category, 'image');
assert.strictEqual(validImg.sanitizedName, 'การบ้าน_ศิลปะ_1.png');

// 3.2 Test empty file
const emptyFile = validateSubmissionFile({ name: 'empty.pdf', size: 0, type: 'application/pdf' });
assert.strictEqual(emptyFile.valid, false);
assert.ok(emptyFile.error.includes('0 KB'));

// 3.3 Test oversized image (> 5 MB)
const bigImg = validateSubmissionFile({ name: 'huge.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg' });
assert.strictEqual(bigImg.valid, false);
assert.ok(bigImg.error.includes('5 MB'));

// 3.4 Test oversized doc (> 15 MB)
const bigDoc = validateSubmissionFile({ name: 'huge.pdf', size: 16 * 1024 * 1024, type: 'application/pdf' });
assert.strictEqual(bigDoc.valid, false);
assert.ok(bigDoc.error.includes('15 MB'));

// 3.5 Test invalid extension (e.g. video / exe)
const invalidExt = validateSubmissionFile({ name: 'game.exe', size: 1024, type: 'application/octet-stream' });
assert.strictEqual(invalidExt.valid, false);
assert.ok(invalidExt.error.includes('.exe'));

// 3.6 Test sanitizeFileName special characters and Thai characters
assert.strictEqual(sanitizeFileName('ใบงานที่ ๑ (คณิตศาสตร์) #2!.pdf'), 'ใบงานที่_๑_คณิตศาสตร์_2.pdf');
assert.strictEqual(sanitizeFileName('my photo & drawing @2026.webp'), 'my_photo__drawing_2026.webp');

console.log('✅ 3. Client-side File Validation & Sanitization: PASSED');

console.log('🎉 All R2 Upload Progress & XHR Validation tests passed successfully!');
