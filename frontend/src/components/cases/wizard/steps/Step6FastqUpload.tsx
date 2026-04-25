'use client';

import React, { useRef, useState } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import type { FastqFile } from '@/types/sample';

export const Step6FastqUpload: React.FC = () => {
  const { uploadedFiles, addUploadedFile, updateUploadedFile } = useCaseWizardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const isR1 = file.name.includes('_R1_') || file.name.endsWith('_1.fastq.gz');
      const newFile: FastqFile = {
        filename: file.name,
        file_path: URL.createObjectURL(file),
        file_size: file.size,
        read_pair: isR1 ? 'r1' : 'r2',
        upload_status: 'uploaded',
        upload_progress: 100,
      };
      addUploadedFile(newFile);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">FASTQ File Upload</h3>
        <p className="text-sm text-gray-500 mt-1">
          Upload FASTQ sequencing files for the registered samples.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".fastq,.fastq.gz,.fq,.fq.gz"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isUploading ? 'Processing...' : 'Select FASTQ Files'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Accepted formats: .fastq, .fastq.gz, .fq.gz
          </p>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                  <p className="text-xs text-gray-500">
                    {formatSize(file.file_size)} &bull; {file.read_pair === 'r1' ? 'Read 1' : 'Read 2'}
                  </p>
                </div>
                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                  file.upload_status === 'uploaded'
                    ? 'bg-green-100 text-green-700'
                    : file.upload_status === 'uploading'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {file.upload_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
