'use client';

import React, { useState, useEffect } from 'react';
import { usePatientStore } from '@/stores/patientStore';
import { useHospitalStore } from '@/stores/hospitalStore';

interface CreatePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: any) => void;
}

export const CreatePatientDialog: React.FC<CreatePatientDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    external_patient_id: '',
    sex: '',
    date_of_birth: '',
    hospital_id: null as number | null,
    consent_status: 'pending',
    clinical_notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { createPatient, isLoading, error, clearError } = usePatientStore();
  const { hospitals, loadHospitals } = useHospitalStore();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        external_patient_id: '',
        sex: '',
        date_of_birth: '',
        hospital_id: null,
        consent_status: 'pending',
        clinical_notes: '',
      });
      setErrors({});
      clearError();
      loadHospitals();
    }
  }, [isOpen, clearError, loadHospitals]);

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.external_patient_id.trim()) {
      newErrors.external_patient_id = 'Patient ID is required';
    } else if (formData.external_patient_id.length < 3) {
      newErrors.external_patient_id = 'Must be at least 3 characters';
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.external_patient_id)) {
      newErrors.external_patient_id = 'Only letters, numbers, underscores, and hyphens';
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      if (isNaN(dob.getTime())) {
        newErrors.date_of_birth = 'Invalid date';
      } else if (dob > new Date()) {
        newErrors.date_of_birth = 'Cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.consent_status) {
      newErrors.consent_status = 'Consent status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    const patient = await createPatient({
      external_patient_id: formData.external_patient_id.trim(),
      sex: formData.sex || undefined,
      date_of_birth: formData.date_of_birth || undefined,
      hospital_id: formData.hospital_id || undefined,
      consent_status: formData.consent_status,
      clinical_notes: formData.clinical_notes || undefined,
    });

    if (patient) {
      onSuccess?.(patient);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Patient</h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {step} of 2 &bull; {step === 1 ? 'Identification' : 'Clinical & Compliance'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="p-6 space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.external_patient_id}
                      onChange={(e) => setFormData({ ...formData, external_patient_id: e.target.value })}
                      placeholder="e.g., P-001, PATIENT-001"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                        errors.external_patient_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const year = new Date().getFullYear();
                        const bytes = new Uint8Array(6);
                        crypto.getRandomValues(bytes);
                        const hash = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
                        setFormData({ ...formData, external_patient_id: `PATIENT-${year}-${hash}` });
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center gap-1.5 shrink-0"
                      title="Generate random Patient ID"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm">Generate</span>
                    </button>
                  </div>
                  {errors.external_patient_id && (
                    <p className="mt-1 text-sm text-red-500">{errors.external_patient_id}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Pseudonymized identifier for de-identification (GDPR-safe)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sex
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Not specified</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 text-sm text-red-500">{errors.date_of_birth}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Hospital Integration
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hospital
                    </label>
                    <select
                      value={formData.hospital_id ?? ''}
                      onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (not specified)</option>
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.code})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Healthcare facility or reference laboratory (optional)
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Consent & Compliance
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consent Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.consent_status}
                      onChange={(e) => setFormData({ ...formData, consent_status: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.consent_status ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="granted">Granted</option>
                      <option value="denied">Denied</option>
                    </select>
                    {errors.consent_status && (
                      <p className="mt-1 text-sm text-red-500">{errors.consent_status}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Required for genomic data processing and clinical research
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Clinical Notes
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.clinical_notes}
                      onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                      rows={4}
                      placeholder="Relevant clinical information, family history, previous treatments..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6">
            <div className="flex justify-between gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              )}

              <div className="flex-1" />

              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {step === 2 && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Patient'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
