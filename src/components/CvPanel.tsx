'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ACCEPTED_CV_EXTENSIONS,
  CV_BUCKET,
  MAX_CVS,
  MAX_CV_BYTES,
  buildCvPath,
  displayName,
  formatBytes,
  formatUploadDate,
  isAcceptedCvFile,
  latestCvs,
  overflowCvs,
  type CvFile,
} from '@/lib/cv';

interface CvPanelProps {
  userId: string;
  lockedHeight?: number;
}

export default function CvPanel({ userId, lockedHeight }: CvPanelProps) {
  const [cvs, setCvs] = useState<CvFile[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingCv, setDeletingCv] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    const { data, error: listError } = await supabase.storage
      .from(CV_BUCKET)
      .list(userId, { limit: 100 });

    if (listError) {
      setError('Failed to load CVs');
      setCvs([]);
      return;
    }

    setCvs(latestCvs(data || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isAcceptedCvFile(file.name)) {
      setError(`Only ${ACCEPTED_CV_EXTENSIONS.join(', ')} files are accepted`);
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setError('File is too large (max 300 KB)');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const { error: uploadError } = await supabase.storage
        .from(CV_BUCKET)
        .upload(buildCvPath(userId, file.name), file);

      if (uploadError) {
        setError('Failed to upload CV');
        return;
      }

      // Enforce the cap: keep only the MAX_CVS newest files
      const { data: allFiles } = await supabase.storage
        .from(CV_BUCKET)
        .list(userId, { limit: 100 });
      const stale = overflowCvs(allFiles || []);
      if (stale.length > 0) {
        await supabase.storage
          .from(CV_BUCKET)
          .remove(stale.map((cv) => `${userId}/${cv.name}`));
      }

      await refresh();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (cv: CvFile) => {
    setError('');
    const { data, error: downloadError } = await supabase.storage
      .from(CV_BUCKET)
      .download(`${userId}/${cv.name}`);

    if (downloadError || !data) {
      setError('Failed to download CV');
      return;
    }

    const objectUrl = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = displayName(cv.name);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleDelete = async (cv: CvFile) => {
    const cvName = displayName(cv.name);
    if (!window.confirm(`Delete "${cvName}"? This cannot be undone.`)) return;

    setDeletingCv(cv.name);
    setError('');

    try {
      const { error: deleteError } = await supabase.storage
        .from(CV_BUCKET)
        .remove([`${userId}/${cv.name}`]);

      if (deleteError) {
        setError('Failed to delete CV');
        return;
      }

      setCvs((current) =>
        current?.filter((currentCv) => currentCv.name !== cv.name) || [],
      );
    } finally {
      setDeletingCv(null);
    }
  };

  const retentionNote = `Your ${MAX_CVS} most recent CVs are kept; uploading a new one replaces the oldest.`;
  const uploadButton = (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={isUploading}
      className="h-6 shrink-0 px-2 text-xs leading-none font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded transition-colors"
      data-testid="cv-upload-button"
    >
      {isUploading ? 'Uploading…' : 'Upload CV'}
    </button>
  );
  const retentionTooltip = (
    <div className="relative">
      <button
        type="button"
        className="peer flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        aria-label="CV retention policy"
        aria-describedby="cv-retention-tooltip"
      >
        i
      </button>
      <div
        id="cv-retention-tooltip"
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-64 rounded-md bg-slate-900 px-2.5 py-2 text-xs leading-4 text-white opacity-0 shadow-lg transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100"
      >
        {retentionNote}
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 ${
        lockedHeight ? 'lg:h-[var(--cv-panel-height)]' : ''
      }`}
      style={
        lockedHeight ? ({
          '--cv-panel-height': `${lockedHeight}px`,
        } as React.CSSProperties) : undefined
      }
      role="region"
      aria-label="CV files"
      data-testid="cv-panel"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_CV_EXTENSIONS.join(',')}
        onChange={handleUpload}
        className="hidden"
        data-testid="cv-upload-input"
      />

      {error && (
        <div
          className="mb-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg"
          data-testid="cv-error"
        >
          {error}
        </div>
      )}

      {cvs === null ? (
        <>
          <div className="flex items-center gap-1 mb-1">
            {uploadButton}
            {retentionTooltip}
          </div>
          <div className="space-y-1" data-testid="cv-list-loading">
            <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
            <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </>
      ) : cvs.length === 0 ? (
        <div
          className="flex flex-1 items-center justify-center"
          data-testid="cv-list-empty"
        >
          <div className="relative">
            {uploadButton}
            <div className="absolute left-full top-0 ml-1">
              {retentionTooltip}
            </div>
          </div>
          <span className="sr-only">No CVs uploaded yet.</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-1">
            {uploadButton}
            {retentionTooltip}
          </div>
          <ul className="space-y-1" data-testid="cv-list">
            {cvs.map((cv) => (
            <li
              key={cv.name}
              className="group flex items-center justify-between gap-3 px-3 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-md"
              data-testid="cv-item"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {displayName(cv.name)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatUploadDate(cv.createdAt)} · {formatBytes(cv.sizeBytes)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(cv)}
                  disabled={deletingCv === cv.name}
                  className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md transition-colors disabled:opacity-50"
                  data-testid="cv-download-button"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cv)}
                  disabled={deletingCv !== null}
                  aria-label={`Delete ${displayName(cv.name)}`}
                  title="Delete CV"
                  className="flex h-6 w-6 items-center justify-center rounded text-base leading-none text-gray-400 opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait dark:text-gray-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  data-testid="cv-delete-button"
                >
                  {deletingCv === cv.name ? '…' : '×'}
                </button>
              </div>
            </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
