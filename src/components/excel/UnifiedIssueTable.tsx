import React from 'react';
import { ExcelComparisonResult } from '../../models/ExcelComparisonResult';

interface UnifiedIssueTableProps {
  items: ExcelComparisonResult[];
  issueType: 'missing' | 'itemNumber' | 'quantity' | 'ignored';
  duroActions: Record<string, boolean>;
  solidworksActions: Record<string, boolean>;
  comments: Record<string, string>;
  onDuroActionChange: (partNumber: string, checked: boolean) => void;
  onSolidworksActionChange: (partNumber: string, checked: boolean) => void;
  onCommentChange: (partNumber: string, comment: string) => void;
  onIgnoreToggle?: (partNumber: string) => void;
}

export const UnifiedIssueTable: React.FC<UnifiedIssueTableProps> = ({
  items,
  issueType,
  duroActions,
  solidworksActions,
  comments,
  onDuroActionChange,
  onSolidworksActionChange,
  onCommentChange,
  onIgnoreToggle,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-glass mb-2">No Issues Found</h3>
        <p className="text-glass-secondary">All items match between BOMs.</p>
      </div>
    );
  }

  const getColorClasses = () => {
    if (issueType === 'missing') return 'bg-red-900 bg-opacity-20 border-red-400';
    if (issueType === 'itemNumber') return 'bg-yellow-900 bg-opacity-20 border-yellow-400';
    if (issueType === 'quantity') return 'bg-blue-900 bg-opacity-20 border-blue-400';
    return 'bg-gray-800 bg-opacity-20 border-gray-400';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className={`${getColorClasses()} border-b-2`}>
            <th className="px-4 py-3 text-left text-sm font-semibold text-glass">Part Number</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-glass">Description</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-glass">SOLIDWORKS</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-glass">DURO</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-glass">Update DURO</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-glass">Flag for SW</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-glass">Notes</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-glass">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={`${item.partNumber}-${index}`}
              className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors"
            >
              {/* Part Number */}
              <td className="px-4 py-3 font-medium text-glass">{item.partNumber}</td>

              {/* Description */}
              <td className="px-4 py-3 text-sm text-glass max-w-xs truncate" title={item.primaryDescription || item.secondaryDescription || ''}>
                {item.primaryDescription || item.secondaryDescription || '-'}
              </td>

              {/* SOLIDWORKS Value */}
              <td className="px-4 py-3 text-sm">
                {issueType === 'itemNumber' && (
                  <div>
                    <div className="text-xs text-glass-secondary">Item #:</div>
                    <div className="font-medium text-glass">{item.primaryItemNumber || '-'}</div>
                  </div>
                )}
                {issueType === 'quantity' && (
                  <div>
                    <div className="text-xs text-glass-secondary">Qty:</div>
                    <div className="font-medium text-glass">{item.primaryQuantity || '-'}</div>
                  </div>
                )}
                {issueType === 'missing' && (
                  <div>
                    {item.inPrimaryOnly ? (
                      <>
                        <div className="text-xs text-glass-secondary">Item #: {item.primaryItemNumber}</div>
                        <div className="text-xs text-glass-secondary">Qty: {item.primaryQuantity}</div>
                      </>
                    ) : (
                      <span className="text-red-400 font-medium">Missing</span>
                    )}
                  </div>
                )}
              </td>

              {/* DURO Value */}
              <td className="px-4 py-3 text-sm">
                {issueType === 'itemNumber' && (
                  <div>
                    <div className="text-xs text-glass-secondary">Item #:</div>
                    <div className="font-medium text-glass">{item.secondaryItemNumber || '-'}</div>
                  </div>
                )}
                {issueType === 'quantity' && (
                  <div>
                    <div className="text-xs text-glass-secondary">Qty:</div>
                    <div className="font-medium text-glass">{item.secondaryQuantity || '-'}</div>
                  </div>
                )}
                {issueType === 'missing' && (
                  <div>
                    {item.inSecondaryOnly ? (
                      <>
                        <div className="text-xs text-glass-secondary">Item #: {item.secondaryItemNumber}</div>
                        <div className="text-xs text-glass-secondary">Qty: {item.secondaryQuantity}</div>
                      </>
                    ) : (
                      <span className="text-red-400 font-medium">Missing</span>
                    )}
                  </div>
                )}
              </td>

              {/* Update DURO Checkbox */}
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={duroActions[item.partNumber] || false}
                  onChange={(e) => onDuroActionChange(item.partNumber, e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-400 focus:ring-blue-500 cursor-pointer"
                  disabled={item.inSecondaryOnly} // Can't update DURO if part doesn't exist there
                  title={item.inSecondaryOnly ? 'Part does not exist in DURO' : 'Include in DURO update file'}
                />
              </td>

              {/* Flag for SOLIDWORKS Checkbox */}
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={solidworksActions[item.partNumber] || false}
                  onChange={(e) => onSolidworksActionChange(item.partNumber, e.target.checked)}
                  className="h-5 w-5 text-orange-600 rounded border-gray-400 focus:ring-orange-500 cursor-pointer"
                  title="Flag for manual SOLIDWORKS update"
                />
              </td>

              {/* Notes/Comments */}
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={comments[item.partNumber] || ''}
                  onChange={(e) => onCommentChange(item.partNumber, e.target.value)}
                  placeholder="Add notes..."
                  className="w-full px-3 py-2 text-sm bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-glass placeholder-glass-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-opacity-20"
                />
              </td>

              {/* Ignore/Restore Action */}
              <td className="px-4 py-3 text-center">
                {onIgnoreToggle && (
                  <button
                    onClick={() => onIgnoreToggle(item.partNumber)}
                    className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                    title={issueType === 'ignored' ? 'Restore this item' : 'Ignore this item'}
                  >
                    {issueType === 'ignored' ? (
                      // Restore icon (undo/rotate-left)
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      // Ignore icon (eye-slash)
                      <svg className="w-5 h-5 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
