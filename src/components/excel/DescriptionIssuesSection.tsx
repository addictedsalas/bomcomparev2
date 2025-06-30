import React, { useState } from 'react';
import { ExcelComparisonResult } from '../../models/ExcelComparisonResult';

interface DescriptionIssuesSectionProps {
  descriptionIssues: ExcelComparisonResult[];
  comments: { [key: string]: string };
  updateSources: Record<string, { pdm: boolean; duro: boolean }>;
  onCommentChange: (partNumber: string, comment: string) => void;
  onUpdateSourceChange: (partNumber: string, source: 'pdm' | 'duro', checked: boolean) => void;
}

export const DescriptionIssuesSection: React.FC<DescriptionIssuesSectionProps> = ({
  descriptionIssues,
  comments,
  updateSources,
  onCommentChange,
  onUpdateSourceChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (descriptionIssues.length === 0) return null;

  return (
    <div className="glass-card animate-slide-up">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer border-b border-white border-opacity-20"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-glass flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
          Description Issues ({descriptionIssues.length})
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
                  <th className="text-left py-3 px-4">SOLIDWORKS Description</th>
                  <th className="text-left py-3 px-4">DURO Description</th>
                  <th className="text-left py-3 px-4">Update SW</th>
                  <th className="text-left py-3 px-4">Update DURO</th>
                  <th className="text-left py-3 px-4">Comments</th>
                </tr>
              </thead>
              <tbody>
                {descriptionIssues.map((part, index) => {
                  const updateKey = `${part.partNumber}-description`;
                  return (
                    <tr key={`${part.partNumber}-${index}`}>
                      <td className="py-3 px-4 text-glass font-medium">{part.partNumber}</td>
                      <td className="py-3 px-4 text-glass-secondary max-w-xs">
                        <div className="truncate" title={part.primaryDescription}>
                          {part.primaryDescription}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-glass-secondary max-w-xs">
                        <div className="truncate" title={part.secondaryDescription}>
                          {part.secondaryDescription}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={updateSources[updateKey]?.pdm || false}
                          onChange={(e) => onUpdateSourceChange(updateKey, 'pdm', e.target.checked)}
                          className="glass-checkbox"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={updateSources[updateKey]?.duro || false}
                          onChange={(e) => onUpdateSourceChange(updateKey, 'duro', e.target.checked)}
                          className="glass-checkbox"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={comments[part.partNumber] || ''}
                          onChange={(e) => onCommentChange(part.partNumber, e.target.value)}
                          className="w-full px-3 py-2 glass-input text-sm"
                          placeholder="Add a comment..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};