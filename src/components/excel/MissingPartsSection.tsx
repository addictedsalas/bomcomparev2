import React, { useState } from 'react';
import { ExcelComparisonResult } from '../../models/ExcelComparisonResult';

interface MissingPartsSectionProps {
  missingParts: ExcelComparisonResult[];
  comments: { [key: string]: string };
  onCommentChange: (partNumber: string, comment: string) => void;
}

export const MissingPartsSection: React.FC<MissingPartsSectionProps> = ({
  missingParts,
  comments,
  onCommentChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (missingParts.length === 0) return null;

  return (
    <div className="glass-card animate-slide-up">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer border-b border-white border-opacity-20"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-glass flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
          Missing Parts ({missingParts.length})
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
                  <th className="text-left py-3 px-4">Missing From</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Comments</th>
                </tr>
              </thead>
              <tbody>
                {missingParts.map((part, index) => (
                  <tr key={`${part.partNumber}-${index}`}>
                    <td className="py-3 px-4 text-glass font-medium">{part.partNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        part.inSecondaryOnly 
                          ? 'bg-blue-500 bg-opacity-20 text-blue-300' 
                          : 'bg-orange-500 bg-opacity-20 text-orange-300'
                      }`}>
                        {part.inSecondaryOnly ? 'SOLIDWORKS' : 'DURO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-glass-secondary">
                      {part.inSecondaryOnly ? part.secondaryDescription : part.primaryDescription}
                    </td>
                    <td className="py-3 px-4 text-glass">
                      {part.inSecondaryOnly ? part.secondaryQuantity : part.primaryQuantity}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};