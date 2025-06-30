import React, { useState, useRef, useEffect } from 'react';
import { ExcelBomData } from '../../models/ExcelBomData';
import { ExcelComparisonSummary } from '../../models/ExcelComparisonResult';
import { parseExcelFile } from '../../utils/excelParser';
import { compareExcelBoms } from '../../services/excelComparisonService';
import { ExcelComparisonResults } from './ExcelComparisonResults';
import { ExcelBomTable } from './ExcelBomTable';

export const ExcelComparisonView: React.FC = () => {
  const [primaryBom, setPrimaryBom] = useState<ExcelBomData | null>(null);
  const [secondaryBom, setSecondaryBom] = useState<ExcelBomData | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ExcelComparisonSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tablesExpanded, setTablesExpanded] = useState<boolean>(true);
  const [primaryDragActive, setPrimaryDragActive] = useState<boolean>(false);
  const [secondaryDragActive, setSecondaryDragActive] = useState<boolean>(false);
  
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to results when they become available
  useEffect(() => {
    if (comparisonResults && resultsRef.current) {
      // Auto-collapse tables when results are available
      setTablesExpanded(false);
      
      // Wait a bit for the DOM to update before scrolling
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
    }
  }, [comparisonResults]);
  
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
      setError('Failed to parse primary Excel file. Please check the format.');
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
      const data = await parseExcelFile(file, false); // false for DURO BOM
      setSecondaryBom(data);
      
      // Reset comparison results when a new file is uploaded
      setComparisonResults(null);
    } catch (err) {
      setError('Failed to parse secondary Excel file. Please check the format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
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
      // Check if the file is an Excel file
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handlePrimaryFileUpload(file);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
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
      // Check if the file is an Excel file
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handleSecondaryFileUpload(file);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };
  
  const handlePrimaryFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setPrimaryFile(file);
      const data = await parseExcelFile(file, true); // true for PDM BOM
      setPrimaryBom(data);
      
      // Reset comparison results when a new file is uploaded
      setComparisonResults(null);
    } catch (err) {
      setError('Failed to parse primary Excel file. Please check the format.');
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
      const data = await parseExcelFile(file, false); // false for DURO BOM
      setSecondaryBom(data);
      
      // Reset comparison results when a new file is uploaded
      setComparisonResults(null);
    } catch (err) {
      setError('Failed to parse secondary Excel file. Please check the format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeletePrimaryFile = () => {
    setPrimaryBom(null);
    setPrimaryFile(null);
    setComparisonResults(null);
    
    // Reset file input
    if (primaryFileInputRef.current) primaryFileInputRef.current.value = '';
  };
  
  const handleDeleteSecondaryFile = () => {
    setSecondaryBom(null);
    setSecondaryFile(null);
    setComparisonResults(null);
    
    // Reset file input
    if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
  };
  
  const handleCompare = () => {
    if (!primaryBom || !secondaryBom) {
      setError('Please upload both Excel files before comparing.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
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
    setComparisonResults(null);
    setError(null);
    
    // Reset file inputs
    if (primaryFileInputRef.current) primaryFileInputRef.current.value = '';
    if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
  };
  
  return (
    <div className="space-y-6 font-sans">
      {/* Main Content */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => setTablesExpanded(!tablesExpanded)}
        >
          <h2 className="text-xl font-bold text-blue-800">Excel BOM Files</h2>
          <div className="flex items-center">
            <span className="mr-2 text-gray-600">
              {tablesExpanded ? 'Collapse' : 'Expand'} Files
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 text-blue-600 transform transition-transform ${tablesExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Collapsible Content */}
        <div 
          className={`grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden transition-all duration-300 ${
            tablesExpanded 
              ? 'max-h-[2000px] opacity-100 mt-4' 
              : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          {/* Primary Excel File Upload */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">PDM BOM</h2>
            
            <div 
              className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                primaryDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragEnter={handlePrimaryDrag}
              onDragOver={handlePrimaryDrag}
              onDragLeave={handlePrimaryDrag}
              onDrop={handlePrimaryDrop}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-700 mb-3">Drag and drop your PDM Excel file here, or</p>
                  <button
                    onClick={() => primaryFileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Browse Files
                  </button>
                  <p className="text-gray-500 text-sm mt-2">Upload Excel with ITEM NO., PART NUMBER, DESCRIPTION, QTY. columns</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">PDM BOM Loaded</p>
                  <p className="text-green-600 font-medium mb-2">✓ Loaded {primaryBom?.items.length} parts</p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleDeletePrimaryFile}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Remove File
                    </button>
                    <button
                      onClick={() => primaryFileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Display the PDM Excel file data in a table */}
            {primaryFile && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">PDM BOM Data</h3>
                <ExcelBomTable bomExcelFile={primaryFile} sourceType="pdm" />
              </div>
            )}
          </div>
          
          {/* Secondary Excel File Upload */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-800">DURO BOM</h2>
            
            <div 
              className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                secondaryDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'
              }`}
              onDragEnter={handleSecondaryDrag}
              onDragOver={handleSecondaryDrag}
              onDragLeave={handleSecondaryDrag}
              onDrop={handleSecondaryDrop}
            >
              <input
                type="file"
                ref={secondaryFileInputRef}
                onChange={handleSecondaryFileChange}
                accept=".xlsx,.xls"
                className="hidden"
              />
              
              {!secondaryFile ? (
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-700 mb-3">Drag and drop your DURO Excel file here, or</p>
                  <button
                    onClick={() => secondaryFileInputRef.current?.click()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Browse Files
                  </button>
                  <p className="text-gray-500 text-sm mt-2">Upload Excel with Item Number, CPN, Description, Quantity columns</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">DURO BOM Loaded</p>
                  <p className="text-green-600 font-medium mb-2">✓ Loaded {secondaryBom?.items.length} parts</p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleDeleteSecondaryFile}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Remove File
                    </button>
                    <button
                      onClick={() => secondaryFileInputRef.current?.click()}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Display the DURO Excel file data in a table */}
            {secondaryFile && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">DURO BOM Data</h3>
                <ExcelBomTable bomExcelFile={secondaryFile} sourceType="duro" />
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-4">
          <button
            onClick={handleCompare}
            disabled={!primaryBom || !secondaryBom || loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !primaryBom || !secondaryBom || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Processing...' : 'Compare BOMs'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {/* Comparison Results */}
      {comparisonResults && (
        <div ref={resultsRef}>
          <ExcelComparisonResults results={comparisonResults} />
        </div>
      )}
    </div>
  );
};
