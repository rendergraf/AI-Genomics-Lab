'use client';

import React from 'react';
import type { Patient } from '@/types/patient';

interface PatientCardProps {
  patient: Patient;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Patient Information</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          patient.consent_status === 'granted' ? 'bg-green-100 text-green-700' :
          patient.consent_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {patient.consent_status}
        </span>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Patient ID</dt>
          <dd className="font-medium text-gray-900">{patient.external_patient_id}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Sex</dt>
          <dd className="font-medium text-gray-900">{patient.sex || 'Not specified'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Date of Birth</dt>
          <dd className="font-medium text-gray-900">{patient.date_of_birth || 'Not set'}</dd>
        </div>
        {patient.hospital_id && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Hospital ID</dt>
            <dd className="font-medium text-gray-900">{patient.hospital_id}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};
