import * as XLSX from 'xlsx';
import { ExcelBomData, ExcelBomItem } from '../models/ExcelBomData';

export interface ExcelParseResult {
  bomData: ExcelBomData;
  rawData: unknown[];
}

export const parseExcelFile = (file: File, isPrimary: boolean): Promise<ExcelBomData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get headers as array first
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawData || rawData.length < 2) {
          throw new Error('Excel file is empty or has no data rows');
        }
        
        const headerRow = rawData[0] as string[];
        console.log('Excel Headers:', headerRow);
        
        // Find column indices based on header names
        const findColumnIndex = (possibleNames: string[]): number => {
          const index = headerRow.findIndex(header => {
            if (!header) return false;
            const headerText = header.toString().toLowerCase().trim();
            return possibleNames.some(name => headerText.includes(name.toLowerCase()));
          });
          return index;
        };
        
        // Define possible header names for each column
        const itemNumberNames = ['item no', 'item number', 'item #', 'line', 'position'];
        const partNumberNames = ['part number', 'part no', 'part #', 'cpn', 'pn', 'number', 'partnumber'];
        const descriptionNames = ['description', 'desc', 'name', 'title', 'part name'];
        const quantityNames = ['qty', 'quantity', 'count', 'amount', 'qty.'];
        const levelNames = ['level', 'lvl', 'indent'];
        
        // Find column indices
        const itemNumberCol = findColumnIndex(itemNumberNames);
        const partNumberCol = findColumnIndex(partNumberNames);
        const descriptionCol = findColumnIndex(descriptionNames);
        const quantityCol = findColumnIndex(quantityNames);
        const levelCol = !isPrimary ? findColumnIndex(levelNames) : -1;
        
        console.log('Found column indices:', {
          itemNumber: itemNumberCol,
          partNumber: partNumberCol,
          description: descriptionCol,
          quantity: quantityCol,
          level: levelCol
        });
        
        // Convert to JSON with header option
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Map to our model with flexible column access
        const items: ExcelBomItem[] = [];
        
        for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
          const rawRow = jsonData[rowIndex];
          const row = rawRow as Record<string, unknown>;
          // Find the actual keys in the row that match our target columns
          const findValue = (colIndex: number, fallbackKeys: string[]): string => {
            if (colIndex >= 0) {
              // If we found the column by index, use the actual header name as key
              const headerKey = headerRow[colIndex]?.toString();
              if (headerKey && row[headerKey] !== undefined) {
                return row[headerKey]?.toString() || '';
              }
            }
            
            // Fallback: try common keys directly
            for (const key of fallbackKeys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.toLowerCase().includes(key.toLowerCase()) && row[rowKey] !== undefined) {
                  return row[rowKey]?.toString() || '';
                }
              }
            }
            
            // Last resort: for PDM/DURO specific formats
            if (isPrimary) {
              // PDM specific keys
              if (fallbackKeys === partNumberNames && row['PART NUMBER'] !== undefined) {
                return row['PART NUMBER']?.toString() || '';
              }
              if (fallbackKeys === itemNumberNames && row['ITEM NO.'] !== undefined) {
                return row['ITEM NO.']?.toString() || '';
              }
              if (fallbackKeys === descriptionNames && row['DESCRIPTION'] !== undefined) {
                return row['DESCRIPTION']?.toString() || '';
              }
              if (fallbackKeys === quantityNames && row['QTY.'] !== undefined) {
                return row['QTY.']?.toString() || '';
              }
            } else {
              // DURO specific keys
              if (fallbackKeys === partNumberNames && row['CPN'] !== undefined) {
                return row['CPN']?.toString() || '';
              }
              if (fallbackKeys === itemNumberNames && row['Item Number'] !== undefined) {
                return row['Item Number']?.toString() || '';
              }
              if (fallbackKeys === descriptionNames && row['Description'] !== undefined) {
                return row['Description']?.toString() || '';
              }
              if (fallbackKeys === quantityNames && row['Quantity'] !== undefined) {
                return row['Quantity']?.toString() || '';
              }
            }
            
            return '';
          };
          
          const partNumber = findValue(partNumberCol, partNumberNames);
          
          // Skip rows without part numbers
          if (!partNumber) continue;
          
          // For DURO BOMs, skip the first data row (parent assembly)
          if (!isPrimary && rowIndex === 0) {
            console.log(`Skipping first row (parent assembly): ${partNumber}`);
            continue;
          }
          
          // For DURO BOMs, skip items with LEVEL = 0
          if (!isPrimary && levelCol !== -1) {
            const levelValue = findValue(levelCol, levelNames);
            if (levelValue === '0' || Number(levelValue) === 0) {
              console.log(`Skipping ${partNumber} due to LEVEL = 0`);
              continue;
            }
          }
          
          const item: ExcelBomItem = {
            itemNumber: findValue(itemNumberCol, itemNumberNames),
            partNumber,
            description: findValue(descriptionCol, descriptionNames),
            quantity: findValue(quantityCol, quantityNames),
          };
          
          items.push(item);
        }
        
        console.log(`📄 Parsed ${items.length} items from Excel file (isPrimary: ${isPrimary})`);
        if (items.length > 0) {
          console.log('📝 Sample parsed items:');
          items.slice(0, Math.min(5, items.length)).forEach((item, index) => {
            console.log(`  ${index + 1}. Part: ${item.partNumber}, Item #: ${item.itemNumber}, Qty: ${item.quantity}`);
          });
        }
        resolve({ items });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const parseExcelFileWithRawData = (file: File, isPrimary: boolean): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get raw data as JSON objects (preserving all columns)
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        console.log(`Raw data extracted: ${rawData.length} rows`);
        
        // Get headers as array first for parsing
        const rawDataArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawDataArray || rawDataArray.length < 2) {
          throw new Error('Excel file is empty or has no data rows');
        }
        
        const headerRow = rawDataArray[0] as string[];
        console.log('Excel Headers:', headerRow);
        
        // Find column indices based on header names
        const findColumnIndex = (possibleNames: string[]): number => {
          const index = headerRow.findIndex(header => {
            if (!header) return false;
            const headerText = header.toString().toLowerCase().trim();
            return possibleNames.some(name => 
              headerText.includes(name.toLowerCase()) || 
              headerText === name.toLowerCase()
            );
          });
          return index;
        };
        
        // Column mappings for different BOM types
        let partNumberNames: string[];
        let itemNumberNames: string[];
        let descriptionNames: string[];
        let quantityNames: string[];
        
        if (isPrimary) {
          // SOLIDWORKS/PDM BOM columns
          partNumberNames = ['Part Number', 'PN', 'Component', 'CPN'];
          itemNumberNames = ['ITEM NO.', 'Item No', 'Item Number', 'Item #'];
          descriptionNames = ['Description', 'DESCRIPTION', 'Desc'];
          quantityNames = ['QTY.', 'Qty', 'Quantity', 'QUANTITY'];
        } else {
          // DURO BOM columns
          partNumberNames = ['Part Number', 'PN', 'Component', 'CPN'];
          itemNumberNames = ['Item Number']; // Only use 'Item Number', not 'Item'
          descriptionNames = ['Description', 'DESCRIPTION', 'Desc'];
          quantityNames = ['Quantity', 'Qty', 'QTY'];
        }
        
        // Find LEVEL column for DURO BOMs (to exclude LEVEL = 0 items)
        const levelCol = !isPrimary ? findColumnIndex(['Level', 'LEVEL', 'Lvl']) : -1;
        
        const partNumberCol = findColumnIndex(partNumberNames);
        const itemNumberCol = findColumnIndex(itemNumberNames);
        const descriptionCol = findColumnIndex(descriptionNames);
        const quantityCol = findColumnIndex(quantityNames);
        
        console.log('Column indices:', {
          partNumber: partNumberCol,
          itemNumber: itemNumberCol,
          description: descriptionCol,
          quantity: quantityCol,
          level: levelCol
        });
        
        if (partNumberCol === -1) {
          throw new Error(`Cannot find part number column. Looking for: ${partNumberNames.join(', ')}`);
        }
        
        const items: ExcelBomItem[] = [];
        
        // Parse data rows
        for (let i = 1; i < rawDataArray.length; i++) {
          const row = rawDataArray[i] as unknown[];
          
          const findValue = (colIndex: number): string => {
            if (colIndex === -1) return '';
            const value = row[colIndex];
            return value ? value.toString().trim() : '';
          };
          
          const partNumber = findValue(partNumberCol);
          
          // Skip rows without part numbers
          if (!partNumber) continue;
          
          // For DURO BOMs, skip the first data row (parent assembly)
          if (!isPrimary && i === 1) {
            console.log(`Skipping first row (parent assembly): ${partNumber}`);
            continue;
          }
          
          // For DURO BOMs, skip items with LEVEL = 0
          if (!isPrimary && levelCol !== -1) {
            const levelValue = findValue(levelCol);
            if (levelValue === '0' || Number(levelValue) === 0) {
              console.log(`Skipping ${partNumber} due to LEVEL = 0`);
              continue;
            }
          }
          
          const item: ExcelBomItem = {
            itemNumber: findValue(itemNumberCol),
            partNumber,
            description: findValue(descriptionCol),
            quantity: findValue(quantityCol),
          };
          
          items.push(item);
        }
        
        console.log(`📄 Parsed ${items.length} items from Excel file (isPrimary: ${isPrimary}) + ${rawData.length} raw data rows`);
        if (items.length > 0) {
          console.log('📝 Sample parsed items:');
          items.slice(0, Math.min(5, items.length)).forEach((item, index) => {
            console.log(`  ${index + 1}. Part: ${item.partNumber}, Item #: ${item.itemNumber}, Qty: ${item.quantity}`);
          });
        }
        resolve({ 
          bomData: { items },
          rawData 
        });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};
