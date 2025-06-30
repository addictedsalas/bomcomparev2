import React, { useState } from 'react';
import { ExcelComparisonResult } from '../../models/ExcelComparisonResult';

interface ItemNumberIssuesSectionProps {
  itemNumberIssues: ExcelComparisonResult[];
  comments: { [key: string]: string };
  updateSources: Record<string, { pdm: boolean; duro: boolean }>;
  onCommentChange: (partNumber: string, comment: string) => void;
  onUpdateSourceChange: (partNumber: string, source: 'pdm' | 'duro', checked: boolean) => void;
}

export const ItemNumberIssuesSection: React.FC<ItemNumberIssuesSectionProps> = ({
  itemNumberIssues,
  comments,
  updateSources,
  onCommentChange,
  onUpdateSourceChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (itemNumberIssues.length === 0) return null;

  return (
    <div className="glass-card animate-slide-up">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer border-b border-white border-opacity-20"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-glass flex items-center">
          <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
          Item Number Issues ({itemNumberIssues.length})
        </h3>
        <svg 
          className={`w-6 h-6 text-glass transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isExpanded && (
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full glass-table">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4">Part Number</th>
                  <th className="text-left py-3 px-4">SOLIDWORKS Item #</th>
                  <th className="text-left py-3 px-4">DURO Item #</th>
                  <th className="text-left py-3 px-4">Update SOLIDWORKS</th>
                  <th className="text-left py-3 px-4">Update DURO</th>
                  <th className="text-left py-3 px-4">Comments</th>
                </tr>
              </thead>
              <tbody>
                {itemNumberIssues.map((issue, index) => (
                  <tr key={`${issue.partNumber}-${index}`} className="border-b border-white border-opacity-10">
                    <td className="py-3 px-4 font-medium text-glass">
                      {issue.partNumber}
                    </td>
                    <td className="py-3 px-4 text-glass">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">
                        {issue.primaryItemNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-glass">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                        {issue.secondaryItemNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        className="glass-checkbox"
                        checked={updateSources[`${issue.partNumber}-itemNumber`]?.pdm || false}
                        onChange={(e) => onUpdateSourceChange(`${issue.partNumber}-itemNumber`, 'pdm', e.target.checked)}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        className="glass-checkbox"
                        checked={updateSources[`${issue.partNumber}-itemNumber`]?.duro || false}
                        onChange={(e) => onUpdateSourceChange(`${issue.partNumber}-itemNumber`, 'duro', e.target.checked)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        className="glass-input w-full text-sm"
                        placeholder="Add comment..."
                        value={comments[issue.partNumber] || ''}
                        onChange={(e) => onCommentChange(issue.partNumber, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold text-orange-800">Item Number Differences</h4>
                <p className="text-sm text-orange-700 mt-1">
                  These parts have different item numbers between SOLIDWORKS and DURO. Verify which system should be updated to maintain consistency.
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  💡 <strong>Debug Tip:</strong> Check the browser console for detailed comparison values to identify formatting differences.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};