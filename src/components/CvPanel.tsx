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
}

export default function CvPanel({ userId }: CvPanelProps) {
  const [cvs, setCvs] = useState<CvFile[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      data-testid="cv-panel"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          My CVs
        </h2>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
          data-testid="cv-upload-button"
        >
          {isUploading ? 'Uploading…' : 'Upload CV'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_CV_EXTENSIONS.join(',')}
          onChange={handleUpload}
          className="hidden"
          data-testid="cv-upload-input"
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Your {MAX_CVS} most recent CVs are kept; uploading a new one replaces
        the oldest.
      </p>

      {error && (
        <div
          className="mb-4 p-3 text-sm bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg"
          data-testid="cv-error"
        >
          {error}
        </div>
      )}

      {cvs === null ? (
        <div className="space-y-3" data-testid="cv-list-loading">
          <div className="h-14 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
          <div className="h-14 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>
      ) : cvs.length === 0 ? (
        <p
          className="text-sm text-gray-500 dark:text-gray-400"
          data-testid="cv-list-empty"
        >
          No CVs uploaded yet.
        </p>
      ) : (
        <ul className="space-y-3" data-testid="cv-list">
          {cvs.map((cv) => (
            <li
              key={cv.name}
              className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
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
              <button
                type="button"
                onClick={() => handleDownload(cv)}
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md transition-colors"
                data-testid="cv-download-button"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
