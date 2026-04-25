'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { WizardHeader } from './WizardHeader';
import { WizardNavigation } from './WizardNavigation';
import { WizardSidebar } from './WizardSidebar';
import { Step1Entry } from './steps/Step1Entry';
import { Step2PatientSelection } from './steps/Step2PatientSelection';
import { Step3ClinicalContext } from './steps/Step3ClinicalContext';
import { Step4SampleRegistration } from './steps/Step4SampleRegistration';
import { Step5SequencingSetup } from './steps/Step5SequencingSetup';
import { Step6FastqUpload } from './steps/Step6FastqUpload';
import { Step7RunPipeline } from './steps/Step7RunPipeline';
import { Step8ExecutionDashboard } from './steps/Step8ExecutionDashboard';
import { Step9ResultsPreview } from './steps/Step9ResultsPreview';
import { Step10ReportGeneration } from './steps/Step10ReportGeneration';

const steps = [
  Step1Entry,
  Step2PatientSelection,
  Step3ClinicalContext,
  Step4SampleRegistration,
  Step5SequencingSetup,
  Step6FastqUpload,
  Step7RunPipeline,
  Step8ExecutionDashboard,
  Step9ResultsPreview,
  Step10ReportGeneration,
];

export const CaseWizard: React.FC = () => {
  const { currentStep } = useCaseWizardStore();
  const CurrentStepComponent = steps[currentStep - 1];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <WizardSidebar />
      <div className="flex-1 flex flex-col">
        <WizardHeader />
        <main className="flex-1 overflow-y-auto">
          <CurrentStepComponent />
        </main>
        <WizardNavigation />
      </div>
    </div>
  );
};
