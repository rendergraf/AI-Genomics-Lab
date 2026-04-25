'use client';

import React, { useRef, useState } from 'react';
import type { FastqFile } from '@/types/sample';

interface FastqUploaderProps {
  files: FastqFile[];
  onFilesAdded: (files: FastqFile[]) => void;
  onRemoveFile?: (index: number) => void;
}

export const FastqUploader: React.FC<FastqUploaderProps> = ({ files, onFilesAdded, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setIsUploading(true);
    const newFiles: FastqFile[] = Array.from(selectedFiles).map((file) => ({
      filename: file.name,
      file_path: URL.createObjectURL(file),
      file_size: file.size,
      read_pair: file.name.includes('_R1_') || file.name.endsWith('_1.fastq.gz') ? 'r1' : 'r2',
      upload_status: 'uploaded',
      upload_progress: 100,
    }));

    onFilesAdded(newFiles);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".fastq,.fastq.gz,.fq,.fq.gz"
          onChange={handleSelectFiles}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? 'Processing...' : 'Select FASTQ Files'}
        </button>
        <p className="mt-2 text-xs text-gray-500">Accepted: .fastq, .fastq.gz, .fq.gz</p>
      </div>

      {files.length > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-60 overflow-y-auto">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                <p className="text-xs text-gray-500">
                  {formatSize(file.file_size)} &bull; {file.read_pair === 'r1' ? 'R1' : 'R2'}
                </p>
              </div>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                file.upload_status === 'uploaded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {file.upload_status}
              </span>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="ml-2 text-xs text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
