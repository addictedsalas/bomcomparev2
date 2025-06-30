import React from 'react';
import { ExcelComparisonSummary } from '../../models/ExcelComparisonResult';

type VisibleSections = {
  missingParts: boolean;
  itemNumberIssues: boolean;
  quantityIssues: boolean;
  descriptionIssues: boolean;
};

interface ComparisonFiltersProps {
  results: ExcelComparisonSummary;
  visibleSections: VisibleSections;
  onSectionToggle: (section: keyof VisibleSections, visible: boolean) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const ComparisonFilters: React.FC<ComparisonFiltersProps> = ({
  results,
  visibleSections,
  onSectionToggle,
  searchTerm,
  onSearchChange,
}) => {
  const totalIssues = results.inPrimaryOnly + results.inSecondaryOnly + results.itemNumberIssues + results.quantityIssues + results.descriptionIssues;

  return (
    <div className="glass-card-dark p-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-300">{totalIssues}</div>
            <div className="text-glass-secondary text-sm">Total Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-300">{results.inPrimaryOnly + results.inSecondaryOnly}</div>
            <div className="text-glass-secondary text-sm">Missing Parts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{results.itemNumberIssues}</div>
            <div className="text-glass-secondary text-sm">Item # Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-300">{results.quantityIssues}</div>
            <div className="text-glass-secondary text-sm">Quantity Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-300">{results.descriptionIssues}</div>
            <div className="text-glass-secondary text-sm">Description Issues</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-glass-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-3 pl-10 text-sm glass-input text-glass placeholder-glass-muted"
              placeholder="Search part numbers or descriptions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-glass-secondary hover:text-glass"
                onClick={() => onSearchChange('')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section Toggles */}
      <div className="mt-6 border-t border-white border-opacity-20 pt-6">
        <h3 className="text-lg font-semibold text-glass mb-4">Show Sections:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Missing Parts Toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={visibleSections.missingParts}
              onChange={(e) => onSectionToggle('missingParts', e.target.checked)}
              className="sr-only"
            />
            <div className={`glass-toggle ${visibleSections.missingParts ? 'active' : 'inactive'}`}>
              <span className="glass-toggle-thumb" />
            </div>
            <span className="ml-3 text-glass">
              Missing Parts ({results.inPrimaryOnly + results.inSecondaryOnly})
            </span>
          </label>

          {/* Item Number Issues Toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={visibleSections.itemNumberIssues}
              onChange={(e) => onSectionToggle('itemNumberIssues', e.target.checked)}
              className="sr-only"
            />
            <div className={`glass-toggle ${visibleSections.itemNumberIssues ? 'active' : 'inactive'}`}>
              <span className="glass-toggle-thumb" />
            </div>
            <span className="ml-3 text-glass">
              Item Number Issues ({results.itemNumberIssues})
            </span>
          </label>

          {/* Quantity Issues Toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={visibleSections.quantityIssues}
              onChange={(e) => onSectionToggle('quantityIssues', e.target.checked)}
              className="sr-only"
            />
            <div className={`glass-toggle ${visibleSections.quantityIssues ? 'active' : 'inactive'}`}>
              <span className="glass-toggle-thumb" />
            </div>
            <span className="ml-3 text-glass">
              Quantity Issues ({results.quantityIssues})
            </span>
          </label>

          {/* Description Issues Toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={visibleSections.descriptionIssues}
              onChange={(e) => onSectionToggle('descriptionIssues', e.target.checked)}
              className="sr-only"
            />
            <div className={`glass-toggle ${visibleSections.descriptionIssues ? 'active' : 'inactive'}`}>
              <span className="glass-toggle-thumb" />
            </div>
            <span className="ml-3 text-glass">
              Description Issues ({results.descriptionIssues})
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};