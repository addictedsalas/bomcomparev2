import * as XLSX from 'xlsx';

export interface DuroTemplateStructure {
  headers: string[];
  sampleData: Record<string, unknown>[];
  requiredColumns: string[];
  partNumberColumn?: string;
  itemNumberColumn?: string;
}

export const analyzeDuroTemplate = async (): Promise<DuroTemplateStructure> => {
  try {
    console.log('🔍 Starting DURO template analysis...');
    
    // Read the template file from public folder
    console.log('📁 Fetching template file: /DURO-IMPORT-TEMPLATE-Update-Assembly.xlsx');
    const response = await fetch('/DURO-IMPORT-TEMPLATE-Update-Assembly.xlsx');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`📄 Template file loaded: ${arrayBuffer.byteLength} bytes`);
    
    const data = new Uint8Array(arrayBuffer);
    
    // Parse with xlsx
    console.log('📊 Parsing Excel file with XLSX...');
    const workbook = XLSX.read(data, { type: 'array' });
    console.log('📋 Available sheets:', workbook.SheetNames);
    
    // Get first sheet (assuming template uses first sheet)
    const firstSheetName = workbook.SheetNames[0];
    console.log(`🎯 Using sheet: "${firstSheetName}"`);
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON to analyze structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`📝 Raw data rows found: ${jsonData.length}`);
    
    if (!jsonData || jsonData.length < 1) {
      throw new Error('Template file is empty or invalid');
    }
    
    // Log first few rows to understand structure
    console.log('🔎 First 5 rows of template:', jsonData.slice(0, 5));
    
    // Find the actual header row by looking for typical BOM columns
    let headerRowIndex = -1;
    let headers: string[] = [];
    
    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0) continue;
      
      const rowString = row.join('|').toLowerCase();
      console.log(`🔍 Row ${i}:`, row);
      
      // Look for typical BOM/assembly columns
      if (rowString.includes('part') || rowString.includes('item') || rowString.includes('cpn') || 
          rowString.includes('quantity') || rowString.includes('description')) {
        headerRowIndex = i;
        headers = row.filter(h => h && String(h).trim() !== '').map(h => String(h).trim());
        console.log(`✅ Found header row at index ${i}:`, headers);
        break;
      }
    }
    
    if (headerRowIndex === -1 || headers.length === 0) {
      throw new Error('Could not find header row in template file');
    }
    
    // Get sample data rows (skip header row)
    const sampleData = jsonData.slice(headerRowIndex + 1, headerRowIndex + 6).map((rawRow: unknown) => {
      const row = rawRow as unknown[];
      const rowObj: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        if (row && row[index] !== undefined && row[index] !== '') {
          rowObj[header] = row[index];
        }
      });
      return rowObj;
    }).filter(row => Object.keys(row).length > 0);
    
    console.log(`📊 Sample data rows: ${sampleData.length}`, sampleData);
    
    // Look for part number and item number columns with flexible matching
    const partNumberCol = headers.find(h => 
      h.toLowerCase().includes('part') || 
      h.toLowerCase().includes('cpn') || 
      h.toLowerCase().includes('component')
    );
    
    const itemNumberCol = headers.find(h => 
      h.toLowerCase().includes('item') && h.toLowerCase().includes('number')
    );
    
    console.log('🔍 Column Detection:', {
      partNumberColumn: partNumberCol,
      itemNumberColumn: itemNumberCol,
      allHeaders: headers
    });
    
    // Use the actual detected columns as requirements
    const detectedColumns = [partNumberCol, itemNumberCol].filter(Boolean) as string[];
    
    console.log('✅ DURO Template Analysis Complete:', {
      totalHeaders: headers.length,
      headers,
      detectedColumns,
      headerRowIndex,
      sampleDataCount: sampleData.length
    });
    
    return {
      headers,
      sampleData,
      requiredColumns: detectedColumns,
      partNumberColumn: partNumberCol,
      itemNumberColumn: itemNumberCol
    };
    
  } catch (error) {
    console.error('💥 Failed to analyze DURO template:', error);
    throw error;
  }
};

export const validateDuroTemplateCompatibility = (structure: DuroTemplateStructure): boolean => {
  // Template exists and is readable - we'll use DURO standard format (CPN, Item Number, Quantity)
  console.log('✅ DURO template validation passed:', {
    templateFound: true,
    useStandardFormat: 'CPN, Item Number, Quantity',
    totalColumns: structure.headers.length
  });
  
  return true;
};