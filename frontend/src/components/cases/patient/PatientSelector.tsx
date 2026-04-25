'use client';

import React, { useState, useEffect } from 'react';
import { usePatientStore } from '@/stores/patientStore';
import { CreatePatientDialog } from '@/components/patients/CreatePatientDialog';
import type { Patient } from '@/types/patient';

interface PatientSelectorProps {
  selectedPatient: Patient | null;
  onSelect: (patient: Patient) => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  selectedPatient,
  onSelect,
}) => {
  const { patients, loadPatients, isLoading } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = patients.filter((p) =>
    p.external_patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
        >
          + New Patient
        </button>
      </div>

      {selectedPatient && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">{selectedPatient.external_patient_id}</p>
              <p className="text-xs text-blue-600">
                {selectedPatient.sex || 'N/A'} &bull; {selectedPatient.date_of_birth || 'N/A'}
              </p>
            </div>
            <button onClick={() => onSelect(null as unknown as Patient)} className="text-xs text-blue-600 hover:text-blue-800">
              Change
            </button>
          </div>
        </div>
      )}

      {searchQuery && !selectedPatient && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-500 text-center">Loading...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No patients found</div>
          ) : (
            filteredPatients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900">{p.external_patient_id}</p>
                <p className="text-xs text-gray-500">{p.sex || 'N/A'} &bull; {p.date_of_birth || 'N/A'}</p>
              </button>
            ))
          )}
        </div>
      )}

      <CreatePatientDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={(patient) => {
          onSelect(patient);
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};
