import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ExcelComparisonSummary, ExcelComparisonResult } from '../../models/ExcelComparisonResult';
import { ExcelComparisonExport } from './ExcelComparisonExport';
import { normalizeText } from '../../utils/textUtils';

interface ExcelComparisonResultsProps {
  results: ExcelComparisonSummary;
}

const ExcelComparisonResults: React.FC<ExcelComparisonResultsProps> = ({ results }) => {
  const [updateSources, setUpdateSources] = useState<Record<string, { pdm: boolean; duro: boolean }>>(() => {
    // Load update sources from localStorage
    const savedUpdateSources = localStorage.getItem('bom-comparison-update-sources');
    return savedUpdateSources ? JSON.parse(savedUpdateSources) : {};
  });
  const [comments, setComments] = useState<{ [key: string]: string }>(() => {
    // Load comments from localStorage
    const savedComments = localStorage.getItem('bom-comparison-comments');
    return savedComments ? JSON.parse(savedComments) : {};
  });
  const [showNormalizedText, setShowNormalizedText] = useState(false);
  const [ignoredItems, setIgnoredItems] = useState<{ [key: string]: boolean }>(() => {
    // Load ignored items from localStorage
    const savedIgnoredItems = localStorage.getItem('bom-comparison-ignored-items');
    return savedIgnoredItems ? JSON.parse(savedIgnoredItems) : {};
  });
  const [collapsedSections, setCollapsedSections] = useState(() => {
    // Load collapsed sections from localStorage
    const savedCollapsedSections = localStorage.getItem('bom-comparison-collapsed-sections');
    return savedCollapsedSections ? JSON.parse(savedCollapsedSections) : {
      missingParts: false,
      itemNumberIssues: false,
      quantityIssues: false,
      descriptionIssues: false
    };
  });
  const [summaryStats, setSummaryStats] = useState(results);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'partNumber', 'description'
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleUpdateSourceChange = (
    partNumber: string,
    issueType: string,
    source: 'pdm' | 'duro',
    checked: boolean
  ) => {
    const key = `${partNumber}-${issueType}`;
    setUpdateSources(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { pdm: false, duro: false }),
        [source]: checked,
      },
    }));
  };

  const handleCommentChange = (partNumber: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [partNumber]: comment
    }));
  };

  // Helper function to toggle section collapse state
  const toggleSectionCollapse = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev: typeof collapsedSections) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function to get the issue type for a result
  const getIssueType = (result: ExcelComparisonResult): string => {
    if (result.inPrimaryOnly || result.inSecondaryOnly) return 'missing';
    if (result.itemNumberIssue) return 'itemNumber';
    if (result.quantityIssue) return 'quantity';
    if (result.descriptionIssue) return 'description';
    return 'none';
  };


  // Toggle ignore state for an item
  const toggleIgnoreItem = (result: ExcelComparisonResult) => {
    const key = `${result.partNumber}-${getIssueType(result)}`;
    setIgnoredItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };


  // Check if an item is ignored
  const isItemIgnored = useCallback((result: ExcelComparisonResult): boolean => {
    const key = `${result.partNumber}-${getIssueType(result)}`;
    return !!ignoredItems[key];
  }, [ignoredItems]);



  // Update summary stats when ignored items change
  useEffect(() => {
    const filteredResults = results.results.filter(
      result => !isItemIgnored(result)
    );

    setSummaryStats({
      ...results,
      itemNumberIssues: filteredResults.filter(r => r.itemNumberIssue).length,
      quantityIssues: filteredResults.filter(r => r.quantityIssue).length,
      descriptionIssues: filteredResults.filter(r => r.descriptionIssue).length,
      inPrimaryOnly: filteredResults.filter(r => r.inPrimaryOnly).length,
      inSecondaryOnly: filteredResults.filter(r => r.inSecondaryOnly).length,
    });
  }, [ignoredItems, results, isItemIgnored]);

  // Save ignored items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bom-comparison-ignored-items', JSON.stringify(ignoredItems));
  }, [ignoredItems]);

  // Save comments to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bom-comparison-comments', JSON.stringify(comments));
  }, [comments]);

  // Save collapsed sections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bom-comparison-collapsed-sections', JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  // Save update sources to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bom-comparison-update-sources', JSON.stringify(updateSources));
  }, [updateSources]);

  // Filter results based on search term
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return results.results;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return results.results.filter(result => {
      if (searchFilter === 'partNumber') {
        return result.partNumber.toLowerCase().includes(term);
      } else if (searchFilter === 'description') {
        return (
          (result.primaryDescription && result.primaryDescription.toLowerCase().includes(term)) ||
          (result.secondaryDescription && result.secondaryDescription.toLowerCase().includes(term))
        );
      } else {
        // Search in all fields
        return (
          result.partNumber.toLowerCase().includes(term) ||
          (result.primaryDescription && result.primaryDescription.toLowerCase().includes(term)) ||
          (result.secondaryDescription && result.secondaryDescription.toLowerCase().includes(term)) ||
          (result.primaryItemNumber && result.primaryItemNumber.toString().includes(term)) ||
          (result.secondaryItemNumber && result.secondaryItemNumber.toString().includes(term))
        );
      }
    });
  }, [results.results, searchTerm, searchFilter]);

  // Calculate filtered summary stats
  const filteredSummaryStats = useMemo(() => {
    if (!searchTerm.trim()) {
      return summaryStats;
    }
    
    const filteredAndNotIgnored = filteredResults.filter(result => !isItemIgnored(result));
    
    return {
      ...results,
      itemNumberIssues: filteredAndNotIgnored.filter(r => r.itemNumberIssue).length,
      quantityIssues: filteredAndNotIgnored.filter(r => r.quantityIssue).length,
      descriptionIssues: filteredAndNotIgnored.filter(r => r.descriptionIssue).length,
      inPrimaryOnly: filteredAndNotIgnored.filter(r => r.inPrimaryOnly).length,
      inSecondaryOnly: filteredAndNotIgnored.filter(r => r.inSecondaryOnly).length,
    };
  }, [filteredResults, isItemIgnored, results, summaryStats, searchTerm]);

  // Reset all ignored items
  const resetIgnoredItems = () => {
    if (window.confirm('Are you sure you want to reset all ignored items? This action cannot be undone.')) {
      setIgnoredItems({});
    }
  };

  // Generate action plan based on update preferences
  // const generateActionPlan = () => {
    // Prepare data for action plan
    const pdmUpdates: Array<{
      partNumber: string;
      issueType: string;
      currentValue: string;
      newValue: string;
      comment: string;
    }> = [];
    const duroUpdates: Array<{
      partNumber: string;
      issueType: string;
      currentValue: string;
      newValue: string;
      comment: string;
    }> = [];

    // Process all non-ignored items with update preferences
    results.results
      .filter(result => !isItemIgnored(result))
      .forEach(result => {
        const source = updateSources[`${result.partNumber}-${getIssueType(result)}`];
        const comment = comments[result.partNumber] || '';

        // Skip if no update preference is set
        if (!source || (!source.pdm && !source.duro)) return;

        // Determine issue type
        let issueType = '';
        if (result.inSecondaryOnly) issueType = 'Missing in PDM';
        else if (result.inPrimaryOnly) issueType = 'Missing in DURO';
        else if (result.itemNumberIssue) issueType = 'Item Number Issue';
        else if (result.quantityIssue) issueType = 'Quantity Issue';
        else if (result.descriptionIssue) issueType = 'Description Issue';
        else return; // Skip if no issue

        // Add to PDM updates
        if (source.pdm) {
          pdmUpdates.push({
            partNumber: result.partNumber,
            issueType,
            currentValue: result.inSecondaryOnly ? 'Missing' :
              result.itemNumberIssue ? (result.primaryItemNumber || '') :
              result.quantityIssue ? (result.primaryQuantity || '') :
              result.descriptionIssue ? (result.primaryDescription || '') : '',
            newValue: result.inSecondaryOnly ? 'Add part' :
              result.itemNumberIssue ? (result.secondaryItemNumber || '') :
              result.quantityIssue ? (result.secondaryQuantity || '') :
              result.descriptionIssue ? (result.secondaryDescription || '') : '',
            comment
          });
        }

        // Add to DURO updates
        if (source.duro) {
          duroUpdates.push({
            partNumber: result.partNumber,
            issueType,
            currentValue: result.inPrimaryOnly ? 'Missing' :
              result.itemNumberIssue ? (result.secondaryItemNumber || '') :
              result.quantityIssue ? (result.secondaryQuantity || '') :
              result.descriptionIssue ? (result.secondaryDescription || '') : '',
            newValue: result.inPrimaryOnly ? 'Add part' :
              result.itemNumberIssue ? (result.primaryItemNumber || '') :
              result.quantityIssue ? (result.primaryQuantity || '') :
              result.descriptionIssue ? (result.primaryDescription || '') : '',
            comment
          });
        }
      });

    // Create action plan document
    let actionPlanContent = `# BOM Comparison Action Plan\n\n`;
    actionPlanContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Add PDM updates section
    actionPlanContent += `## PDM Updates (${pdmUpdates.length} items)\n\n`;
    if (pdmUpdates.length > 0) {
      actionPlanContent += `| Part Number | Issue Type | Current Value | New Value | Comment |\n`;
      actionPlanContent += `|------------|------------|---------------|-----------|--------|\n`;
      pdmUpdates.forEach(update => {
        actionPlanContent += `| ${update.partNumber} | ${update.issueType} | ${update.currentValue} | ${update.newValue} | ${update.comment} |\n`;
      });
    } else {
      actionPlanContent += `No PDM updates required.\n`;
    }

    // Add DURO updates section
    actionPlanContent += `\n## DURO Updates (${duroUpdates.length} items)\n\n`;
    if (duroUpdates.length > 0) {
      actionPlanContent += `| Part Number | Issue Type | Current Value | New Value | Comment |\n`;
      actionPlanContent += `|------------|------------|---------------|-----------|--------|\n`;
      duroUpdates.forEach(update => {
        actionPlanContent += `| ${update.partNumber} | ${update.issueType} | ${update.currentValue} | ${update.newValue} | ${update.comment} |\n`;
      });
    } else {
      actionPlanContent += `No DURO updates required.\n`;
    }

    // Create download link for action plan
    const blob = new Blob([actionPlanContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOM_Action_Plan_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  // };

  return (
    <div ref={resultsRef} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-glass">BOM Comparison Results</h2>
        <div className="flex space-x-4">
          <ExcelComparisonExport
            results={results}
            updateSources={updateSources}
            comments={comments}
          />
          <button
            onClick={resetIgnoredItems}
            className="glass-button px-4 py-2 text-glass flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Ignored
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-glass-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="search"
                className="block w-full p-3 pl-10 text-sm glass-upload border-0 bg-transparent text-glass placeholder-glass-secondary focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                placeholder="Search for part number, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setSearchTerm('')}
                >
                  <svg className="w-5 h-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="flex items-center">
              <input
                id="filter-all"
                type="radio"
                name="search-filter"
                value="all"
                checked={searchFilter === 'all'}
                onChange={() => setSearchFilter('all')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="filter-all" className="ml-2 text-sm font-medium text-gray-900">All Fields</label>
            </div>
            <div className="flex items-center">
              <input
                id="filter-part"
                type="radio"
                name="search-filter"
                value="partNumber"
                checked={searchFilter === 'partNumber'}
                onChange={() => setSearchFilter('partNumber')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="filter-part" className="ml-2 text-sm font-medium text-gray-900">Part Number</label>
            </div>
            <div className="flex items-center">
              <input
                id="filter-desc"
                type="radio"
                name="search-filter"
                value="description"
                checked={searchFilter === 'description'}
                onChange={() => setSearchFilter('description')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="filter-desc" className="ml-2 text-sm font-medium text-gray-900">Description</label>
            </div>
          </div>
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Found {filteredResults.length} results for &quot;{searchTerm}&quot;
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-gray-100 p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{results.totalParts}</div>
          <div className="text-sm text-gray-600">Total Parts</div>
        </div>

        <div className="bg-green-100 p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{results.matchingParts}</div>
          <div className="text-sm text-green-600">Matching Parts</div>
        </div>

        <div className="bg-red-100 p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{filteredSummaryStats.inPrimaryOnly + filteredSummaryStats.inSecondaryOnly}</div>
          <div className="text-sm text-red-600">Missing Parts</div>
        </div>

        <div className="bg-yellow-100 p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{filteredSummaryStats.itemNumberIssues}</div>
          <div className="text-sm text-yellow-600">Item # Issues</div>
        </div>

        <div className="bg-blue-100 p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{filteredSummaryStats.quantityIssues}</div>
          <div className="text-sm text-blue-600">Quantity Issues</div>
        </div>

        <div className="bg-purple-100 p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{filteredSummaryStats.descriptionIssues}</div>
          <div className="text-sm text-purple-600">Description Issues</div>
        </div>

        <div className="bg-gray-100 p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{Object.keys(ignoredItems).filter(key => ignoredItems[key]).length}</div>
          <div className="text-sm text-gray-600">Ignored Issues</div>
        </div>
      </div>

      {/* Missing Parts */}
      {(filteredSummaryStats.inPrimaryOnly + filteredSummaryStats.inSecondaryOnly) > 0 && (
        <div className="mb-8">
          <div
            className="flex justify-between items-center cursor-pointer mb-3"
            onClick={() => toggleSectionCollapse('missingParts')}
          >
            <h3 className="text-xl font-bold text-red-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Missing Parts
            </h3>
            <div className="flex items-center">
              <span className="mr-2 text-red-700 font-semibold">
                {filteredSummaryStats.inPrimaryOnly + filteredSummaryStats.inSecondaryOnly} issues
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${collapsedSections.missingParts ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {!collapsedSections.missingParts && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-red-50">
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Part Number</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Item #</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Description</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Missing From</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Update PDM</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Update DURO</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Comments</th>
                    <th className="px-4 py-3 text-left text-red-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults
                    .filter(result => (result.inPrimaryOnly || result.inSecondaryOnly) && !isItemIgnored(result))
                    .map((result, index) => (
                      <tr
                        key={`missing-${result.partNumber}-${index}`}
                        className="border-t border-red-100 hover:bg-red-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{result.partNumber}</td>
                        <td className="px-4 py-3">
                          {result.inPrimaryOnly ? result.primaryItemNumber : result.secondaryItemNumber}
                        </td>
                        <td className="px-4 py-3">
                          {result.inPrimaryOnly ? result.primaryDescription : result.secondaryDescription}
                        </td>
                        <td className="px-4 py-3">
                          {result.inPrimaryOnly ? result.primaryQuantity : result.secondaryQuantity}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {result.inPrimaryOnly ? 'DURO' : 'PDM'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-red-600 rounded border-red-300 focus:ring-red-500"
                            checked={updateSources[`${result.partNumber}-missing`]?.pdm || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'missing', 'pdm', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-red-600 rounded border-red-300 focus:ring-red-500"
                            checked={updateSources[`${result.partNumber}-missing`]?.duro || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'missing', 'duro', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={comments[result.partNumber] || ''}
                            onChange={(e) => handleCommentChange(result.partNumber, e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Add a comment..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleIgnoreItem(result)}
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors mr-2"
                            title="Ignore this issue"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Item Number Issues */}
      {filteredSummaryStats.itemNumberIssues > 0 && (
        <div className="mb-8">
          <div
            className="flex justify-between items-center cursor-pointer mb-3"
            onClick={() => toggleSectionCollapse('itemNumberIssues')}
          >
            <h3 className="text-xl font-bold text-yellow-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Item Number Mismatches
            </h3>
            <div className="flex items-center">
              <span className="mr-2 text-yellow-700 font-semibold">
                {filteredSummaryStats.itemNumberIssues} issues
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${collapsedSections.itemNumberIssues ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {!collapsedSections.itemNumberIssues && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-yellow-50">
                    <th className="px-4 py-3 text-left text-yellow-800 font-semibold">Part Number</th>
                    <th className="px-4 py-3 text-left text-yellow-800 font-semibold">PDM Item #</th>
                    <th className="px-4 py-3 text-left text-yellow-800 font-semibold">DURO Item #</th>
                    <th className="px-4 py-3 text-left text-yellow-800 font-semibold">Update PDM</th>
                    <th className="px-4 py-3 text-left text-yellow-800 font-semibold">Update DURO</th>
                    <th className="px-4 py-3 text-left text-yellow-800 font-semibold">Comments</th>
                    <th className="px-4 py-3 text-left text-yellow-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults
                    .filter(result => result.itemNumberIssue && !isItemIgnored(result))
                    .map((result, index) => (
                      <tr
                        key={`item-${result.partNumber}-${index}`}
                        className="border-t border-yellow-100 hover:bg-yellow-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{result.partNumber}</td>
                        <td className="px-4 py-3">{result.primaryItemNumber}</td>
                        <td className="px-4 py-3">{result.secondaryItemNumber}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-yellow-600 rounded border-yellow-300 focus:ring-yellow-500"
                            checked={updateSources[`${result.partNumber}-itemNumber`]?.pdm || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'itemNumber', 'pdm', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-yellow-600 rounded border-yellow-300 focus:ring-yellow-500"
                            checked={updateSources[`${result.partNumber}-itemNumber`]?.duro || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'itemNumber', 'duro', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={comments[result.partNumber] || ''}
                            onChange={(e) => handleCommentChange(result.partNumber, e.target.value)}
                            className="w-full px-3 py-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="Add a comment..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleIgnoreItem(result)}
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors mr-2"
                            title="Ignore this issue"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quantity Issues */}
      {filteredSummaryStats.quantityIssues > 0 && (
        <div className="mb-8">
          <div
            className="flex justify-between items-center cursor-pointer mb-3"
            onClick={() => toggleSectionCollapse('quantityIssues')}
          >
            <h3 className="text-xl font-bold text-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Quantity Differences
            </h3>
            <div className="flex items-center">
              <span className="mr-2 text-blue-700 font-semibold">
                {filteredSummaryStats.quantityIssues} issues
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${collapsedSections.quantityIssues ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {!collapsedSections.quantityIssues && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold">Part Number</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold">PDM Quantity</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold">DURO Quantity</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold">Update PDM</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold">Update DURO</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold">Comments</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults
                    .filter(result => result.quantityIssue && !isItemIgnored(result))
                    .map((result, index) => (
                      <tr
                        key={`quantity-${result.partNumber}-${index}`}
                        className="border-t border-blue-100 hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{result.partNumber}</td>
                        <td className="px-4 py-3">{result.primaryQuantity}</td>
                        <td className="px-4 py-3">{result.secondaryQuantity}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
                            checked={updateSources[`${result.partNumber}-quantity`]?.pdm || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'quantity', 'pdm', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
                            checked={updateSources[`${result.partNumber}-quantity`]?.duro || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'quantity', 'duro', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={comments[result.partNumber] || ''}
                            onChange={(e) => handleCommentChange(result.partNumber, e.target.value)}
                            className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add a comment..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleIgnoreItem(result)}
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors mr-2"
                            title="Ignore this issue"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Description Issues */}
      {filteredSummaryStats.descriptionIssues > 0 && (
        <div className="mb-8">
          <div
            className="flex justify-between items-center cursor-pointer mb-3"
            onClick={() => toggleSectionCollapse('descriptionIssues')}
          >
            <h3 className="text-xl font-bold text-purple-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Description Differences
            </h3>
            <div className="flex items-center">
              <span className="mr-2 text-purple-700 font-semibold">
                {filteredSummaryStats.descriptionIssues} issues
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${collapsedSections.descriptionIssues ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showNormalizedText}
                onChange={() => setShowNormalizedText(!showNormalizedText)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">Show Normalized Text</span>
            </label>
          </div>

          {!collapsedSections.descriptionIssues && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="px-4 py-3 text-left text-purple-800 font-semibold">Part Number</th>
                    <th className="px-4 py-3 text-left text-purple-800 font-semibold">PDM Description</th>
                    <th className="px-4 py-3 text-left text-purple-800 font-semibold">DURO Description</th>
                    <th className="px-4 py-3 text-left text-purple-800 font-semibold">Update PDM</th>
                    <th className="px-4 py-3 text-left text-purple-800 font-semibold">Update DURO</th>
                    <th className="px-4 py-3 text-left text-purple-800 font-semibold">Comments</th>
                    <th className="px-4 py-3 text-left text-purple-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults
                    .filter(result => result.descriptionIssue && !isItemIgnored(result))
                    .map((result, index) => (
                      <tr
                        key={`description-${result.partNumber}-${index}`}
                        className="border-t border-purple-100 hover:bg-purple-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{result.partNumber}</td>
                        <td className="px-4 py-3">
                          {showNormalizedText ? (
                            <div>
                              <div className="font-medium text-purple-700 mb-1">Original:</div>
                              <div className="mb-2">{result.primaryDescription}</div>
                              <div className="font-medium text-green-700 mb-1">Normalized:</div>
                              <div className="text-green-800 bg-green-50 p-2 rounded">
                                {normalizeText(result.primaryDescription)}
                              </div>
                            </div>
                          ) : (
                            result.primaryDescription
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {showNormalizedText ? (
                            <div>
                              <div className="font-medium text-purple-700 mb-1">Original:</div>
                              <div className="mb-2">{result.secondaryDescription}</div>
                              <div className="font-medium text-green-700 mb-1">Normalized:</div>
                              <div className="text-green-800 bg-green-50 p-2 rounded">
                                {normalizeText(result.secondaryDescription)}
                              </div>
                            </div>
                          ) : (
                            result.secondaryDescription
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                            checked={updateSources[`${result.partNumber}-description`]?.pdm || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'description', 'pdm', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                            checked={updateSources[`${result.partNumber}-description`]?.duro || false}
                            onChange={(e) => handleUpdateSourceChange(result.partNumber, 'description', 'duro', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={comments[result.partNumber] || ''}
                            onChange={(e) => handleCommentChange(result.partNumber, e.target.value)}
                            className="w-full px-3 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Add a comment..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleIgnoreItem(result)}
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            title="Ignore this issue"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { ExcelComparisonResults };
