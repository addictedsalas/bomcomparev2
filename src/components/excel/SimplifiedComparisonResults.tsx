import React, { useState, useEffect, useMemo } from 'react';
import { ExcelComparisonSummary, ExcelComparisonResult } from '../../models/ExcelComparisonResult';
import { ComparisonFilters } from './ComparisonFilters';
import { MissingPartsSection } from './MissingPartsSection';
import { QuantityIssuesSection } from './QuantityIssuesSection';
import { DescriptionIssuesSection } from './DescriptionIssuesSection';
import { ExcelComparisonExport } from './ExcelComparisonExport';

interface SimplifiedComparisonResultsProps {
  results: ExcelComparisonSummary;
}

export const SimplifiedComparisonResults: React.FC<SimplifiedComparisonResultsProps> = ({ results }) => {
  const [updateSources, setUpdateSources] = useState<Record<string, { pdm: boolean; duro: boolean }>>(() => {
    const saved = localStorage.getItem('bom-comparison-update-sources');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [comments, setComments] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem('bom-comparison-comments');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [visibleSections, setVisibleSections] = useState({
    missingParts: true,
    quantityIssues: true,
    descriptionIssues: true,
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('bom-comparison-update-sources', JSON.stringify(updateSources));
  }, [updateSources]);

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

  // Categorize filtered results
  const categorizedResults = useMemo(() => {
    const missingParts = filteredResults.filter(r => r.inPrimaryOnly || r.inSecondaryOnly);
    const quantityIssues = filteredResults.filter(r => r.quantityIssue && !r.inPrimaryOnly && !r.inSecondaryOnly);
    const descriptionIssues = filteredResults.filter(r => r.descriptionIssue && !r.inPrimaryOnly && !r.inSecondaryOnly);
    
    console.log('Categorized Results:', {
      totalFiltered: filteredResults.length,
      missingParts: missingParts.length,
      quantityIssues: quantityIssues.length,
      descriptionIssues: descriptionIssues.length,
      sampleResult: filteredResults[0]
    });
    
    return {
      missingParts,
      quantityIssues,
      descriptionIssues,
    };
  }, [filteredResults]);

  const handleCommentChange = (partNumber: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [partNumber]: comment
    }));
  };

  const handleUpdateSourceChange = (key: string, source: 'pdm' | 'duro', checked: boolean) => {
    setUpdateSources(prev => ({
      ...prev,
      [key]: {
        pdm: source === 'pdm' ? checked : (prev[key]?.pdm || false),
        duro: source === 'duro' ? checked : (prev[key]?.duro || false)
      }
    }));
  };

  const handleSectionToggle = (section: 'missingParts' | 'quantityIssues' | 'descriptionIssues', visible: boolean) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: visible
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filters and Summary */}
      <ComparisonFilters
        results={results}
        visibleSections={visibleSections}
        onSectionToggle={handleSectionToggle}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Export Controls */}
      <div className="flex justify-end">
        <ExcelComparisonExport
          results={results}
          updateSources={updateSources}
          comments={comments}
        />
      </div>

      {/* Results Sections */}
      <div className="space-y-6">
        {/* Missing Parts */}
        {visibleSections.missingParts && (
          <MissingPartsSection
            missingParts={categorizedResults.missingParts}
            comments={comments}
            onCommentChange={handleCommentChange}
          />
        )}

        {/* Quantity Issues */}
        {visibleSections.quantityIssues && (
          <QuantityIssuesSection
            quantityIssues={categorizedResults.quantityIssues}
            comments={comments}
            updateSources={updateSources}
            onCommentChange={handleCommentChange}
            onUpdateSourceChange={handleUpdateSourceChange}
          />
        )}

        {/* Description Issues */}
        {visibleSections.descriptionIssues && (
          <DescriptionIssuesSection
            descriptionIssues={categorizedResults.descriptionIssues}
            comments={comments}
            updateSources={updateSources}
            onCommentChange={handleCommentChange}
            onUpdateSourceChange={handleUpdateSourceChange}
          />
        )}
      </div>

      {/* No Results Message */}
      {filteredResults.length === 0 && searchTerm && (
        <div className="glass-card p-8 text-center">
          <div className="text-glass-secondary">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-glass mb-2">No results found</h3>
            <p>Try adjusting your search term or clearing the filter.</p>
          </div>
        </div>
      )}
    </div>
  );
};