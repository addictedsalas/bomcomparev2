import React, { useState } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to BOM Comparison Tool",
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold text-glass mb-4">Get Started in 3 Easy Steps</h3>
          <p className="text-glass-secondary text-lg">
            This tool helps you compare Bill of Materials (BOM) between SOLIDWORKS and DURO systems.
          </p>
          <p className="text-glass-secondary">
            Follow this quick tutorial to learn how to export your BOMs properly for comparison.
          </p>
        </div>
      )
    },
    {
      title: "Step 1: Export from DURO",
      content: (
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Navigate to your assembly in DURO</h4>
              <p className="text-glass-secondary">Find the assembly you want to compare in your DURO system.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Click "Export this component"</h4>
              <p className="text-glass-secondary">Look for the export button in the top right corner of the page.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Select "One level BOM"</h4>
              <p className="text-glass-secondary">Open the dropdown below "Export Settings" and choose "One level BOM".</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Click "Export"</h4>
              <p className="text-glass-secondary">This will download your top-level assembly BOM file.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Export from SOLIDWORKS",
      content: (
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Open your assembly drawing</h4>
              <p className="text-glass-secondary">Create or open a drawing from your SOLIDWORKS assembly.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Insert Bill of Materials table</h4>
              <p className="text-glass-secondary">Go to Insert → Tables → Bill of Materials to add a BOM table to your drawing.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Configure for top-level only</h4>
              <p className="text-glass-secondary">In the BOM properties, set the BOM Type to "Top-level only" to match DURO export.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
            <div>
              <h4 className="text-lg font-semibold text-glass mb-2">Export to Excel</h4>
              <p className="text-glass-secondary">Right-click the BOM table → Save As → Choose Excel (.xlsx) format.</p>
            </div>
          </div>

          <div className="glass-card p-4 mt-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-glass-secondary">
                  <strong className="text-glass">Tip:</strong> Avoid special characters like "#" in your file path, as they can prevent SOLIDWORKS from saving Excel files.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Compare Your BOMs",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔄</div>
            <h3 className="text-xl font-bold text-glass mb-2">Ready to Compare!</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div>
                <h4 className="text-lg font-semibold text-glass mb-2">Upload SOLIDWORKS BOM</h4>
                <p className="text-glass-secondary">Drop or select your exported SOLIDWORKS Excel file in the left upload area.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div>
                <h4 className="text-lg font-semibold text-glass mb-2">Upload DURO BOM</h4>
                <p className="text-glass-secondary">Drop or select your exported DURO file in the right upload area.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div>
                <h4 className="text-lg font-semibold text-glass mb-2">Review comparison results</h4>
                <p className="text-glass-secondary">The tool will automatically compare and highlight differences between your BOMs.</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 mt-6">
            <h4 className="text-lg font-semibold text-glass mb-3">What the tool compares:</h4>
            <ul className="space-y-2 text-glass-secondary">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span>Missing parts between systems</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Quantity differences</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Description mismatches</span>
              </li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('bom-tutorial-completed', 'true');
    onClose();
  };

  const handleComplete = () => {
    localStorage.setItem('bom-tutorial-completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative glass-card-dark rounded-xl text-left overflow-hidden shadow-xl transform transition-all w-full max-w-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-glass">{steps[currentStep].title}</h2>
              <button
                onClick={onClose}
                className="text-glass-secondary hover:text-glass transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 min-h-[400px]">
            {steps[currentStep].content}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white border-opacity-20 flex items-center justify-between">
            {/* Progress indicators */}
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-orange-400' 
                      : index < currentStep 
                        ? 'bg-orange-600' 
                        : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex space-x-3">
              {currentStep === 0 && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-glass-secondary hover:text-glass transition-colors"
                >
                  Skip Tutorial
                </button>
              )}
              
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 glass-button"
                >
                  Previous
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 glass-button"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 glass-button"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};