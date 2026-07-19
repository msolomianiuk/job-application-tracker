import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAX_CVS,
  MAX_CV_BYTES,
  buildCvPath,
  displayName,
  formatBytes,
  formatUploadDate,
  isAcceptedCvFile,
  latestCvs,
  overflowCvs,
  sanitizeFileName,
  toCvFile,
  type StorageObjectInfo,
} from '@/lib/cv';

const objects: StorageObjectInfo[] = [
  { name: '100-old.pdf', created_at: '2026-07-01T10:00:00Z', metadata: { size: 1000 } },
  { name: '300-newest.pdf', created_at: '2026-07-19T10:00:00Z', metadata: { size: 3000 } },
  { name: '200-middle.pdf', created_at: '2026-07-10T10:00:00Z', metadata: { size: 2000 } },
];

describe('latestCvs', () => {
  test('returns the newest files first, capped at MAX_CVS', () => {
    const result = latestCvs(objects);

    expect(MAX_CVS).toBe(2);
    expect(result.map((cv) => cv.name)).toEqual(['300-newest.pdf', '200-middle.pdf']);
  });

  test('handles fewer files than the cap', () => {
    expect(latestCvs(objects.slice(0, 1))).toHaveLength(1);
    expect(latestCvs([])).toEqual([]);
  });
});

describe('overflowCvs', () => {
  test('returns everything beyond the newest MAX_CVS for deletion', () => {
    const stale = overflowCvs(objects);

    expect(stale.map((cv) => cv.name)).toEqual(['100-old.pdf']);
  });

  test('is empty at or under the cap', () => {
    expect(overflowCvs(objects.slice(0, 2))).toEqual([]);
  });
});

describe('toCvFile', () => {
  test('defaults missing metadata to zero size and empty date', () => {
    expect(toCvFile({ name: 'a.pdf' })).toEqual({
      name: 'a.pdf',
      createdAt: '',
      sizeBytes: 0,
    });
  });
});

describe('file naming', () => {
  test('buildCvPath scopes the file to the user folder with a timestamp prefix', () => {
    expect(buildCvPath('user-1', 'My Resume.pdf', 1752912000000)).toBe(
      'user-1/1752912000000-My_Resume.pdf',
    );
  });

  test('sanitizeFileName strips path and special characters', () => {
    expect(sanitizeFileName('../..//weird name?.pdf')).toBe('.._.._weird_name_.pdf');
  });

  test('displayName removes the timestamp prefix', () => {
    expect(displayName('1752912000000-My_Resume.pdf')).toBe('My_Resume.pdf');
    expect(displayName('no-prefix.pdf')).toBe('no-prefix.pdf');
  });
});

describe('validation and formatting', () => {
  test('accepts only pdf regardless of case', () => {
    expect(isAcceptedCvFile('cv.pdf')).toBe(true);
    expect(isAcceptedCvFile('CV.PDF')).toBe(true);
    expect(isAcceptedCvFile('cv.docx')).toBe(false);
    expect(isAcceptedCvFile('cv.doc')).toBe(false);
    expect(isAcceptedCvFile('cv.txt')).toBe(false);
    expect(isAcceptedCvFile('cv.pdf.exe')).toBe(false);
  });

  test('formatBytes shows the exact byte count with separators', () => {
    expect(formatBytes(245120)).toBe('245,120 bytes');
    expect(formatBytes(0)).toBe('0 bytes');
  });

  test('formatUploadDate renders a readable date and tolerates bad input', () => {
    expect(formatUploadDate('2026-07-19T10:00:00Z')).toBe('Jul 19, 2026');
    expect(formatUploadDate('not-a-date')).toBe('');
  });

  test('upload cap is 300 KB and matches the storage bucket limit', () => {
    expect(MAX_CV_BYTES).toBe(300 * 1024);

    const sql = readFileSync(
      join(import.meta.dir, '..', '..', 'supabase', 'storage-cvs.sql'),
      'utf8',
    );
    expect(sql).toContain(String(MAX_CV_BYTES));
  });
});
