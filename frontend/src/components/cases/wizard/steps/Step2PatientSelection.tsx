'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { usePatientStore } from '@/stores/patientStore';
import { CreatePatientDialog } from '@/components/patients/CreatePatientDialog';
import type { Patient } from '@/types/patient';

export const Step2PatientSelection: React.FC = () => {
  const { patient, setPatient } = useCaseWizardStore();
  const { patients, loadPatients, searchPatients, isLoading, isSearching } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null as unknown as ReturnType<typeof setTimeout>);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (query.trim()) {
          searchPatients(query);
        } else {
          loadPatients();
        }
      }, 300);
    },
    [searchPatients, loadPatients]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, debouncedSearch]);

  const handleSelect = (p: Patient) => {
    setPatient(p);
    setSearchQuery('');
    setIsFocused(false);
    setHighlightedIndex(-1);
  };

  const handlePatientCreated = (newPatient: Patient) => {
    setPatient(newPatient);
    setSearchQuery('');
    setShowCreateDialog(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < patients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : patients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < patients.length) {
          handleSelect(patients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLButtonElement>('[data-index]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const showDropdown = isFocused && !patient;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Patient Selection</h3>
        <p className="text-sm text-gray-500 mt-1">
          Search for an existing patient or create a new one.
        </p>
      </div>

      <div className="space-y-4">
        {patient ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Selected: {patient.external_patient_id}
                </p>
                <p className="text-xs text-blue-600">
                  {patient.sex || 'Sex not specified'} &bull; {patient.date_of_birth || 'DOB not set'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setPatient(null as unknown as Patient); setSearchQuery(''); }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div ref={wrapperRef} className="relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isSearching && (
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin"
                    fill="none" viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIndex(-1); }}
                  onFocus={() => setIsFocused(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by Patient ID..."
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-controls="patient-listbox"
                  aria-activedescendant={highlightedIndex >= 0 ? `patient-option-${highlightedIndex}` : undefined}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
              >
                + New Patient
              </button>
            </div>

            {showDropdown && (
              <div
                ref={listRef}
                id="patient-listbox"
                role="listbox"
                className="absolute z-10 left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto"
              >
                {isLoading ? (
                  <div className="p-4 text-sm text-gray-500 text-center">Loading...</div>
                ) : isSearching ? (
                  <div className="p-4 text-sm text-gray-500 text-center">Searching...</div>
                ) : patients.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    {searchQuery.trim()
                      ? `No patients match "${searchQuery}"`
                      : 'No patients found. Create a new one.'}
                  </div>
                ) : (
                  patients.map((p, index) => (
                    <button
                      key={p.id}
                      data-index={index}
                      id={`patient-option-${index}`}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      type="button"
                      onClick={() => handleSelect(p)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0 ${
                        highlightedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{p.external_patient_id}</p>
                      <p className="text-xs text-gray-500">
                        {p.sex || 'N/A'} &bull; {p.date_of_birth || 'N/A'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <CreatePatientDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handlePatientCreated}
        />
      </div>
    </div>
  );
};
