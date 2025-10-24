import React, { useState, useEffect, useMemo } from 'react';
import { ExcelComparisonSummary } from '../../models/ExcelComparisonResult';
import { UnifiedIssueTable } from './UnifiedIssueTable';
import { exportDuroUpdates, exportSolidworksActionReport } from '../../services/duroUpdateExportService';

interface TabbedComparisonResultsProps {
  results: ExcelComparisonSummary;
  originalDuroData?: unknown[] | null;
}

type TabType = 'missing' | 'itemNumber' | 'quantity' | 'ignored';

export const TabbedComparisonResults: React.FC<TabbedComparisonResultsProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<TabType>('missing');
  
  const [duroActions, setDuroActions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('bom-comparison-duro-actions');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [solidworksActions, setSolidworksActions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('bom-comparison-solidworks-actions');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [comments, setComments] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('bom-comparison-comments');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [ignoredItems, setIgnoredItems] = useState<Set<string>>(new Set());
  
  const [searchTerm, setSearchTerm] = useState('');

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('bom-comparison-duro-actions', JSON.stringify(duroActions));
  }, [duroActions]);

  useEffect(() => {
    localStorage.setItem('bom-comparison-solidworks-actions', JSON.stringify(solidworksActions));
  }, [solidworksActions]);

  useEffect(() => {
    localStorage.setItem('bom-comparison-comments', JSON.stringify(comments));
  }, [comments]);

  // Filter results based on search term
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return results.results;
    
    const term = searchTerm.toLowerCase();
    return results.results.filter(result => 
      result.partNumber.toLowerCase().includes(term) ||
      result.primaryDescription?.toLowerCase().includes(term) ||
      result.secondaryDescription?.toLowerCase().includes(term)
    );
  }, [results.results, searchTerm]);

  // Categorize filtered results (excluding ignored items from main tabs)
  const categorizedResults = useMemo(() => {
    const notIgnored = filteredResults.filter(r => !ignoredItems.has(r.partNumber));
    const ignored = filteredResults.filter(r => ignoredItems.has(r.partNumber));
    
    const missingParts = notIgnored.filter(r => r.inPrimaryOnly || r.inSecondaryOnly);
    const itemNumberIssues = notIgnored.filter(r => r.itemNumberIssue && !r.inPrimaryOnly && !r.inSecondaryOnly);
    const quantityIssues = notIgnored.filter(r => r.quantityIssue && !r.inPrimaryOnly && !r.inSecondaryOnly);
    
    return {
      missingParts,
      itemNumberIssues,
      quantityIssues,
      ignoredItems: ignored,
    };
  }, [filteredResults, ignoredItems]);

  const handleCommentChange = (partNumber: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [partNumber]: comment
    }));
  };

  const handleDuroActionChange = (partNumber: string, checked: boolean) => {
    setDuroActions(prev => ({
      ...prev,
      [partNumber]: checked
    }));
  };

  const handleSolidworksActionChange = (partNumber: string, checked: boolean) => {
    setSolidworksActions(prev => ({
      ...prev,
      [partNumber]: checked
    }));
  };

  const handleIgnoreToggle = (partNumber: string) => {
    setIgnoredItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partNumber)) {
        newSet.delete(partNumber); // Restore
      } else {
        newSet.add(partNumber); // Ignore
      }
      return newSet;
    });
  };

  const handleExportDuroUpdates = () => {
    exportDuroUpdates(results.results, duroActions, comments);
  };

  const handleExportSolidworksReport = () => {
    exportSolidworksActionReport(results.results, solidworksActions, comments);
  };

  // Calculate counts for each tab
  const tabCounts = {
    missing: categorizedResults.missingParts.length,
    itemNumber: categorizedResults.itemNumberIssues.length,
    quantity: categorizedResults.quantityIssues.length,
    ignored: categorizedResults.ignoredItems.length,
  };

  // Auto-select first tab with issues
  useEffect(() => {
    if (tabCounts.missing > 0) setActiveTab('missing');
    else if (tabCounts.itemNumber > 0) setActiveTab('itemNumber');
    else if (tabCounts.quantity > 0) setActiveTab('quantity');
  }, [tabCounts.missing, tabCounts.itemNumber, tabCounts.quantity]);

  const tabs = [
    { id: 'missing' as TabType, label: 'Missing Parts', count: tabCounts.missing, color: 'red' },
    { id: 'itemNumber' as TabType, label: 'Item Number Issues', count: tabCounts.itemNumber, color: 'yellow' },
    { id: 'quantity' as TabType, label: 'Quantity Issues', count: tabCounts.quantity, color: 'blue' },
    { id: 'ignored' as TabType, label: 'Ignored Items', count: tabCounts.ignored, color: 'gray' },
  ];

  const duroActionCount = Object.values(duroActions).filter(Boolean).length;
  const swActionCount = Object.values(solidworksActions).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-glass">{results.totalParts}</div>
          <div className="text-sm text-glass-secondary mt-1">Total Parts</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{results.matchingParts}</div>
          <div className="text-sm text-glass-secondary mt-1">Matching</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-red-400">
            {results.inPrimaryOnly + results.inSecondaryOnly}
          </div>
          <div className="text-sm text-glass-secondary mt-1">Missing</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">
            {results.itemNumberIssues + results.quantityIssues}
          </div>
          <div className="text-sm text-glass-secondary mt-1">Issues</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-glass-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            className="block w-full p-3 pl-10 text-sm glass-upload border-0 bg-transparent text-glass placeholder-glass-secondary focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-lg"
            placeholder="Search by part number or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setSearchTerm('')}
            >
              <svg className="w-5 h-5 text-glass-secondary hover:text-glass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-glass-secondary">
            Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for &quot;{searchTerm}&quot;
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="flex gap-4 justify-end">
        {/* Temporarily hidden while determining correct export method */}
        <button
          onClick={handleExportDuroUpdates}
          disabled={duroActionCount === 0}
          className="hidden"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Export DURO Updates ({duroActionCount})
          </div>
        </button>
        <button
          onClick={handleExportSolidworksReport}
          disabled={swActionCount === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            swActionCount > 0
              ? 'glass-button text-glass hover:scale-105'
              : 'bg-gray-400 bg-opacity-30 text-gray-500 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export SW Report ({swActionCount})
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-white border-opacity-20">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all duration-200
                  ${activeTab === tab.id
                    ? `border-${tab.color}-400 text-${tab.color}-400`
                    : 'border-transparent text-glass-secondary hover:text-glass hover:border-glass-secondary'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`
                      inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full
                      ${activeTab === tab.id
                        ? `bg-${tab.color}-400 text-white`
                        : 'bg-glass-secondary bg-opacity-20 text-glass-secondary'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'missing' && (
            <UnifiedIssueTable
              items={categorizedResults.missingParts}
              issueType="missing"
              duroActions={duroActions}
              solidworksActions={solidworksActions}
              comments={comments}
              onDuroActionChange={handleDuroActionChange}
              onSolidworksActionChange={handleSolidworksActionChange}
              onCommentChange={handleCommentChange}
              onIgnoreToggle={handleIgnoreToggle}
            />
          )}

          {activeTab === 'itemNumber' && (
            <UnifiedIssueTable
              items={categorizedResults.itemNumberIssues}
              issueType="itemNumber"
              duroActions={duroActions}
              solidworksActions={solidworksActions}
              comments={comments}
              onDuroActionChange={handleDuroActionChange}
              onSolidworksActionChange={handleSolidworksActionChange}
              onCommentChange={handleCommentChange}
              onIgnoreToggle={handleIgnoreToggle}
            />
          )}

          {activeTab === 'quantity' && (
            <UnifiedIssueTable
              items={categorizedResults.quantityIssues}
              issueType="quantity"
              duroActions={duroActions}
              solidworksActions={solidworksActions}
              comments={comments}
              onDuroActionChange={handleDuroActionChange}
              onSolidworksActionChange={handleSolidworksActionChange}
              onCommentChange={handleCommentChange}
              onIgnoreToggle={handleIgnoreToggle}
            />
          )}

          {activeTab === 'ignored' && (
            <UnifiedIssueTable
              items={categorizedResults.ignoredItems}
              issueType="ignored"
              duroActions={duroActions}
              solidworksActions={solidworksActions}
              comments={comments}
              onDuroActionChange={handleDuroActionChange}
              onSolidworksActionChange={handleSolidworksActionChange}
              onCommentChange={handleCommentChange}
              onIgnoreToggle={handleIgnoreToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
};
