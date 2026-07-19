export const CV_BUCKET = 'cvs';
export const MAX_CVS = 2;
export const MAX_CV_BYTES = 300 * 1024;
export const ACCEPTED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export interface CvFile {
  /** Object name inside the user's folder, e.g. "1752912000000-resume.pdf" */
  name: string;
  createdAt: string;
  sizeBytes: number;
}

/** Subset of the object shape returned by supabase.storage.from().list() */
export interface StorageObjectInfo {
  name: string;
  created_at?: string;
  metadata?: { size?: number } | null;
}

export function toCvFile(object: StorageObjectInfo): CvFile {
  return {
    name: object.name,
    createdAt: object.created_at || '',
    sizeBytes: object.metadata?.size ?? 0,
  };
}

function byNewestFirst(a: CvFile, b: CvFile): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/** The newest `limit` CVs, most recent first. */
export function latestCvs(
  objects: StorageObjectInfo[],
  limit: number = MAX_CVS,
): CvFile[] {
  return objects.map(toCvFile).sort(byNewestFirst).slice(0, limit);
}

/** CVs beyond the newest `keep` — deleted after an upload to enforce the cap. */
export function overflowCvs(
  objects: StorageObjectInfo[],
  keep: number = MAX_CVS,
): CvFile[] {
  return objects.map(toCvFile).sort(byNewestFirst).slice(keep);
}

export function isAcceptedCvFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_CV_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Keeps letters, digits, dots, dashes and underscores so the name is a safe storage key. */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.-]+/g, '_');
}

/** Storage path for a new upload; the timestamp prefix keeps names unique. */
export function buildCvPath(
  userId: string,
  fileName: string,
  now: number = Date.now(),
): string {
  return `${userId}/${now}-${sanitizeFileName(fileName)}`;
}

/** Original file name without the timestamp prefix added by buildCvPath. */
export function displayName(objectName: string): string {
  return objectName.replace(/^\d+-/, '');
}

export function formatBytes(sizeBytes: number): string {
  return `${sizeBytes.toLocaleString('en-US')} bytes`;
}

export function formatUploadDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
