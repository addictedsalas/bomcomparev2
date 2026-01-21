'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ExcelBomData } from '@/models/ExcelBomData';
import { ExcelComparisonSummary } from '@/models/ExcelComparisonResult';
import { parseExcelFile, parseExcelFileWithRawData } from '@/utils/excelParser';
import { compareExcelBoms } from '@/services/excelComparisonService';
import { DuroApiService } from '@/services/duroApiService';
import { TabbedComparisonResults } from '@/components/excel/TabbedComparisonResults';
import { TutorialModal } from '@/components/modals/TutorialModal';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';

export default function Home() {
  const [primaryBom, setPrimaryBom] = useState<ExcelBomData | null>(null);
  const [secondaryBom, setSecondaryBom] = useState<ExcelBomData | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [duroSourceType, setDuroSourceType] = useState<'file' | 'api'>('file');
  const [assemblyNumber, setAssemblyNumber] = useState<string>('');
  const [comparisonResults, setComparisonResults] = useState<ExcelComparisonSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryDragActive, setPrimaryDragActive] = useState<boolean>(false);
  const [secondaryDragActive, setSecondaryDragActive] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [originalDuroData, setOriginalDuroData] = useState<unknown[] | null>(null);
  
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to results when they become available
  useEffect(() => {
    if (comparisonResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
    }
  }, [comparisonResults]);

  // Check if tutorial should be shown on first visit
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('bom-tutorial-completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);
  
  // File upload handlers
  const handlePrimaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      const file = e.target.files[0];
      setPrimaryFile(file);
      const data = await parseExcelFile(file, true); // true for PDM BOM
      setPrimaryBom(data);
      
      // Reset comparison results when a new file is uploaded
      setComparisonResults(null);
    } catch (err) {
      setError('Failed to parse SOLIDWORKS Excel file. Please check the format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSecondaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      const file = e.target.files[0];
      setSecondaryFile(file);
      const result = await parseExcelFileWithRawData(file, false); // false for DURO BOM
      setSecondaryBom(result.bomData);
      setOriginalDuroData(result.rawData);
      
      // Reset comparison results when a new file is uploaded
      setComparisonResults(null);
    } catch (err) {
      setError('Failed to parse DURO Excel file. Please check the format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFetchDuroBom = async () => {
    if (!assemblyNumber.trim()) {
      setError('Please enter an Assembly Number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { bom, rawData } = await DuroApiService.fetchBomByAssemblyNumber(assemblyNumber.trim());
      
      setSecondaryBom(bom);
      setOriginalDuroData(rawData as unknown[]);
      
      // Reset comparison results
      setComparisonResults(null);
      
      // Clear file selection if any
      setSecondaryFile(null);
      if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
      
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch BOM from DURO: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Drag and drop handlers
  const handlePrimaryDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setPrimaryDragActive(true);
    } else if (e.type === 'dragleave') {
      setPrimaryDragActive(false);
    }
  };
  
  const handlePrimaryDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPrimaryDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handlePrimaryFileUpload(file);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };
  
  const handleSecondaryDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setSecondaryDragActive(true);
    } else if (e.type === 'dragleave') {
      setSecondaryDragActive(false);
    }
  };
  
  const handleSecondaryDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSecondaryDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handleSecondaryFileUpload(file);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };
  
  const handlePrimaryFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setPrimaryFile(file);
      const data = await parseExcelFile(file, true);
      setPrimaryBom(data);
      setComparisonResults(null);
    } catch (err) {
      setError('Failed to parse SOLIDWORKS Excel file. Please check the format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSecondaryFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setSecondaryFile(file);
      const result = await parseExcelFileWithRawData(file, false);
      setSecondaryBom(result.bomData);
      setOriginalDuroData(result.rawData);
      setComparisonResults(null);
    } catch (err) {
      setError('Failed to parse DURO Excel file. Please check the format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSecondaryFile = () => {
    setSecondaryBom(null);
    setSecondaryFile(null);
    setOriginalDuroData(null);
    setComparisonResults(null);
    setAssemblyNumber('');
    
    // Reset file input
    if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
  };
  
  // Action handlers
  const handleCompare = () => {
    if (!primaryBom || !secondaryBom) {
      setError('Please upload both Excel files before comparing.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Clear previous comparison data from localStorage
      localStorage.removeItem('bom-comparison-duro-actions');
      localStorage.removeItem('bom-comparison-solidworks-actions');
      localStorage.removeItem('bom-comparison-comments');
      
      const results = compareExcelBoms(primaryBom, secondaryBom);
      setComparisonResults(results);
    } catch (err) {
      setError('Failed to compare Excel files.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReset = () => {
    setPrimaryBom(null);
    setSecondaryBom(null);
    setPrimaryFile(null);
    setSecondaryFile(null);
    setOriginalDuroData(null);
    setComparisonResults(null);
    setAssemblyNumber('');
    setError(null);
    
    if (primaryFileInputRef.current) primaryFileInputRef.current.value = '';
    if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
  };

  return (
    <main className="glass-background">
      <div className="glass-content">
        <div className="container mx-auto px-4 relative z-10">
          {/* Logo and Simple Header */}
          <div className="text-center mb-8 animate-fade-in relative">
            {/* Help Button */}
            <button
              onClick={() => setShowTutorial(true)}
              className="absolute top-0 right-0 glass-button p-3 rounded-full"
              title="Show Tutorial"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="mb-6">
              <Image 
                src="/images/logo.png" 
                alt="Company Logo" 
                width={400}
                height={138}
                className="w-64 mx-auto mb-4"
              />
            </div>
            <h1 className="text-4xl font-bold text-glass mb-2">
              BOM Comparison Tool
            </h1>
            <p className="text-lg text-glass-secondary">
              Compare SOLIDWORKS and DURO exports
            </p>
          </div>

        {/* Main Content */}
        <div className="max-w-8xl mx-auto space-y-8">
          {/* File Upload Section */}
          <div className="glass-card-dark p-8 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SOLIDWORKS BOM Upload */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-glass flex items-center">
                  <svg className="w-8 h-8 mr-3 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  SOLIDWORKS BOM
                </h2>
                
                <div 
                  className={`glass-upload p-8 text-center cursor-pointer ${
                    primaryDragActive ? 'drag-active' : ''
                  }`}
                  onDragEnter={handlePrimaryDrag}
                  onDragOver={handlePrimaryDrag}
                  onDragLeave={handlePrimaryDrag}
                  onDrop={handlePrimaryDrop}
                  onClick={() => primaryFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={primaryFileInputRef}
                    onChange={handlePrimaryFileChange}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  
                  {!primaryFile ? (
                    <div>
                      <svg className="w-16 h-16 mx-auto text-glass mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-glass text-lg mb-2">Drop your SOLIDWORKS Excel file here</p>
                      <p className="text-glass-secondary text-sm">or click to browse</p>
                      <p className="text-glass-secondary text-xs mt-2">
                        Expected columns: ITEM NO., PART NUMBER, DESCRIPTION, QTY.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-glass font-medium mb-2">{primaryFile.name}</p>
                      <p className="text-green-300 font-medium mb-4">✓ {primaryBom?.items.length} parts loaded</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimaryFile(null);
                          setPrimaryBom(null);
                          if (primaryFileInputRef.current) primaryFileInputRef.current.value = '';
                        }}
                        className="glass-button px-4 py-2 text-glass text-sm"
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* DURO BOM Upload */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-glass flex items-center">
                    <svg className="w-8 h-8 mr-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    DURO BOM
                  </h2>
                  
                  <div className="flex bg-glass-dark rounded-lg p-1 border border-glass-border">
                    <button
                      onClick={() => setDuroSourceType('file')}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        duroSourceType === 'file' 
                          ? 'bg-glass-button text-white shadow-sm' 
                          : 'text-glass-secondary hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      onClick={() => setDuroSourceType('api')}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        duroSourceType === 'api' 
                          ? 'bg-glass-button text-white shadow-sm' 
                          : 'text-glass-secondary hover:text-white'
                      }`}
                    >
                      Import from API
                    </button>
                  </div>
                </div>
                
                {duroSourceType === 'file' ? (
                  // File Upload UI
                  <div 
                    className={`glass-upload p-8 text-center cursor-pointer ${
                      secondaryDragActive ? 'drag-active' : ''
                    }`}
                    onDragEnter={handleSecondaryDrag}
                    onDragOver={handleSecondaryDrag}
                    onDragLeave={handleSecondaryDrag}
                    onDrop={handleSecondaryDrop}
                    onClick={() => secondaryFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={secondaryFileInputRef}
                      onChange={handleSecondaryFileChange}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    
                    {!secondaryBom ? (
                      <div>
                        <svg className="w-16 h-16 mx-auto text-glass mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-glass text-lg mb-2">Drop your DURO Excel file here</p>
                        <p className="text-glass-secondary text-sm">or click to browse</p>
                        <p className="text-glass-secondary text-xs mt-2">
                          Expected columns: Item Number, CPN, Description, Quantity
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center mb-4">
                          <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-glass font-medium mb-2">{secondaryFile ? secondaryFile.name : 'DURO File Loaded'}</p>
                        <p className="text-green-300 font-medium mb-4">✓ {secondaryBom?.items.length} parts loaded</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSecondaryFile();
                          }}
                          className="glass-button px-4 py-2 text-glass text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // API Import UI
                  <div className="glass-upload p-8 text-center">
                    {!secondaryBom ? (
                      <div>
                        <svg className="w-16 h-16 mx-auto text-glass mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-glass text-lg mb-4">Enter DURO Assembly Number</p>
                        
                        <div className="flex gap-2 max-w-sm mx-auto">
                          <input
                            type="text"
                            value={assemblyNumber}
                            onChange={(e) => setAssemblyNumber(e.target.value)}
                            placeholder="e.g. 406-00043"
                            className="flex-1 rounded-lg border border-glass-border bg-glass-dark text-white shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleFetchDuroBom()}
                          />
                          <button
                            onClick={handleFetchDuroBom}
                            disabled={loading || !assemblyNumber.trim()}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              loading || !assemblyNumber.trim()
                                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                          >
                            {loading ? '...' : 'Fetch'}
                          </button>
                        </div>
                        <p className="text-glass-secondary text-xs mt-4">
                          Fetches the BOM directly from the DURO API
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center mb-4">
                          <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-glass font-medium mb-1">DURO BOM Fetched</p>
                        <p className="text-green-300 font-bold mb-2">{assemblyNumber}</p>
                        <p className="text-green-300 font-medium mb-4">✓ {secondaryBom.items.length} parts loaded</p>
                        <button
                          onClick={handleDeleteSecondaryFile}
                          className="glass-button px-4 py-2 text-glass text-sm"
                        >
                          Clear & Search Again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-8 justify-center">
              <button
                onClick={handleCompare}
                disabled={!primaryBom || !secondaryBom || loading}
                className={`px-8 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
                  !primaryBom || !secondaryBom || loading
                    ? 'bg-gray-400 bg-opacity-50 text-gray-300 cursor-not-allowed'
                    : 'glass-button text-glass hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner mr-3"></div>
                    Comparing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Compare BOMs
                  </div>
                )}
              </button>
              
              <button
                onClick={handleReset}
                className="glass-button px-6 py-3 rounded-xl text-lg font-medium text-glass"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </div>
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 text-red-100 animate-fade-in">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>
          
          {/* Comparison Results */}
          {comparisonResults && (
            <div ref={resultsRef} className="animate-slide-up">
              <div className="glass-results p-8">
                <h2 className="text-3xl font-bold text-glass mb-6 text-center">
                  Comparison Results
                </h2>
                <TabbedComparisonResults results={comparisonResults} originalDuroData={originalDuroData} />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
      
      {/* Feedback Button */}
      <FeedbackButton />
    </main>
  );
}