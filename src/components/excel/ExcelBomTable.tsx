import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface ExcelBomItem {
  itemNumber: number;
  partNumber: string;
  description: string;
  quantity: string;
}

interface ExcelBomTableProps {
  bomExcelFile: File | null;
  sourceType?: 'pdm' | 'duro';
}

export const ExcelBomTable: React.FC<ExcelBomTableProps> = ({ bomExcelFile, sourceType = 'pdm' }) => {
  const [excelData, setExcelData] = useState<ExcelBomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine color scheme based on source type
  const colorScheme = sourceType === 'pdm' 
    ? { 
        bg: 'bg-blue-50', 
        text: 'text-blue-800',
        hover: 'hover:bg-blue-50',
        border: 'border-blue-100'
      } 
    : { 
        bg: 'bg-orange-50', 
        text: 'text-orange-800',
        hover: 'hover:bg-orange-50',
        border: 'border-orange-100'
      };

  useEffect(() => {
    if (!bomExcelFile) {
      setExcelData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        console.log(`${sourceType.toUpperCase()} Raw Excel Data:`, rawData);

        if (!rawData || rawData.length < 2) {
          setError('Excel file is empty or has no data rows');
          setExcelData([]);
          setLoading(false);
          return;
        }

        const headerRow = rawData[0] as string[];
        console.log(`${sourceType.toUpperCase()} Excel Headers:`, headerRow.map((h, i) => `${i}: ${h}`));

        // More flexible column detection
        // Try to find columns by common header names
        let itemCol = -1;
        let cpnCol = -1;
        let descriptionCol = -1;
        let quantityCol = -1;
        let itemNumberCol = -1;

        // Search for column headers using common variations
        headerRow.forEach((header, index) => {
          if (!header) return;
          
          const headerText = header.toString().toLowerCase().trim();
          
          // Item/Item Number column detection
          if (headerText.includes('item') && !headerText.includes('description')) {
            if (itemCol === -1) itemCol = index;
            if (headerText.includes('number') || headerText.includes('no')) {
              itemNumberCol = index;
            }
          }
          
          // Part Number column detection
          if (headerText.includes('part') || 
              headerText.includes('cpn') || 
              headerText.includes('pn') || 
              headerText === 'number') {
            cpnCol = index;
          }
          
          // Description column detection
          if (headerText.includes('desc') || 
              headerText.includes('name') || 
              headerText.includes('title')) {
            descriptionCol = index;
          }
          
          // Quantity column detection
          if (headerText.includes('qty') || 
              headerText.includes('quantity') || 
              headerText.includes('count') || 
              headerText.includes('amount')) {
            quantityCol = index;
          }
        });

        // If we couldn't find the columns by name, use default positions
        if (itemCol === -1) itemCol = 0;
        if (cpnCol === -1) cpnCol = 1;
        if (descriptionCol === -1) descriptionCol = 2;
        if (quantityCol === -1) quantityCol = 3;
        if (itemNumberCol === -1) itemNumberCol = itemCol; // Default to item column if no specific item number column

        console.log(`${sourceType.toUpperCase()} Using column indices:`, {
          item: itemCol,
          cpn: cpnCol,
          description: descriptionCol,
          quantity: quantityCol,
          itemNumber: itemNumberCol
        });

        // Ensure we have at least part number column
        if (cpnCol === -1) {
          setError('Could not identify part number column in Excel file');
          setExcelData([]);
          setLoading(false);
          return;
        }

        // Parse rows into ExcelBomItems
        const items: ExcelBomItem[] = [];
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i] as unknown[];
          if (!row || row.length === 0) continue;

          // Get part number first - this is our key identifier
          const partNumber = cpnCol !== -1 && row[cpnCol] 
            ? String(row[cpnCol] || '').trim()
            : '';
            
          // Skip rows without part numbers
          if (!partNumber) continue;

          // Parse the item number, default to index if not found or invalid
          let itemNumber = i;
          if (itemNumberCol !== -1 && row[itemNumberCol]) {
            const itemStr = String(row[itemNumberCol] || '').trim();
            const parsedItem = parseInt(itemStr);
            if (!isNaN(parsedItem)) {
              itemNumber = parsedItem;
            }
          }

          const item = {
            itemNumber,
            partNumber,
            description: descriptionCol !== -1 && row[descriptionCol] 
              ? String(row[descriptionCol] || '').trim()
              : '',
            quantity: quantityCol !== -1 && row[quantityCol] 
              ? String(row[quantityCol] || '').trim()
              : ''
          };

          items.push(item);
        }

        // Sort items by item number
        const sortedItems = items.sort((a, b) => a.itemNumber - b.itemNumber);
        console.log(`${sourceType.toUpperCase()} Parsed and Sorted Items:`, sortedItems);
        
        if (sortedItems.length === 0) {
          setError('No valid parts found in Excel file');
        } else {
          setError(null);
        }
        
        setExcelData(sortedItems);
      } catch (error) {
        console.error(`Error parsing ${sourceType} Excel file:`, error);
        setError(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setExcelData([]);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error(`FileReader error for ${sourceType}:`, error);
      setError('Error reading file');
      setLoading(false);
    };

    reader.readAsArrayBuffer(bomExcelFile);
  }, [bomExcelFile, sourceType]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${sourceType === 'pdm' ? 'border-blue-500' : 'border-orange-500'}`}></div>
        <span className="ml-3 text-gray-600">Loading Excel data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 px-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-600 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Error Loading Excel Data</span>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <div className="max-h-[400px] overflow-y-auto">
        <table className="min-w-full table-auto">
          <thead className="sticky top-0">
            <tr className={colorScheme.bg}>
              <th className={`px-4 py-3 text-left ${colorScheme.text} font-semibold`}>Item #</th>
              <th className={`px-4 py-3 text-left ${colorScheme.text} font-semibold`}>Part Number</th>
              <th className={`px-4 py-3 text-left ${colorScheme.text} font-semibold`}>Description</th>
              <th className={`px-4 py-3 text-right ${colorScheme.text} font-semibold`}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {excelData.map((item, index) => (
              <tr 
                key={index} 
                className={`border-t ${colorScheme.border} ${colorScheme.hover} transition-colors`}
              >
                <td className="px-4 py-3">{item.itemNumber}</td>
                <td className="px-4 py-3 font-medium">{item.partNumber}</td>
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
              </tr>
            ))}
            {excelData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No data available in Excel file
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
