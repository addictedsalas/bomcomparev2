import * as XLSX from 'xlsx';
import { ExcelComparisonResult } from '../models/ExcelComparisonResult';
import { toDuroFormat } from '../utils/textUtils';

export interface DuroUpdateRow {
  CPN: string;
  Quantity: string;
  'Item Number'?: string;
  Notes?: string;
  'Ref Des'?: string;
}

/**
 * Generates a DURO-ready Excel file for updating the BOM
 * Based on user-selected items marked for DURO update
 */
export const exportDuroUpdates = (
  results: ExcelComparisonResult[],
  duroActions: Record<string, boolean>,
  comments: Record<string, string>
): void => {
  try {
    // Filter items marked for DURO update
    const itemsToUpdate = results.filter(item => duroActions[item.partNumber]);

    if (itemsToUpdate.length === 0) {
      alert('⚠️ No items selected for DURO update.\n\nPlease check the "Update DURO" checkbox for items you want to include in the export.');
      return;
    }

    console.log(`📊 Exporting ${itemsToUpdate.length} items for DURO update`);

    // Create update rows in DURO format
    const updateRows: DuroUpdateRow[] = itemsToUpdate.map(item => {
      // Convert part number to DURO format (with duplicated suffix)
      const duroPartNumber = toDuroFormat(item.partNumber);
      
      // Use SOLIDWORKS values as the source of truth
      const quantity = item.primaryQuantity || item.secondaryQuantity || '1';
      const itemNumber = item.primaryItemNumber || item.secondaryItemNumber || '';
      const notes = comments[item.partNumber] || '';

      console.log(`  - ${item.partNumber} → ${duroPartNumber} (Qty: ${quantity}, Item #: ${itemNumber})`);

      return {
        CPN: duroPartNumber,
        Quantity: quantity,
        'Item Number': itemNumber,
        Notes: notes,
        'Ref Des': '', // Empty for now, can be filled manually
      };
    });

    // Create instructions sheet data
    const instructions = [
      ['INSTRUCTIONS:'],
      ['1. Replace existing example data fields'],
      ['2. Enter the Duro generated CPN for each Component in the assembly'],
      ['3. Enter a Quantity value for each Component'],
      ['4. Add any additional fields as appropriate. Default values will be used for cells left blank'],
      ['5. File -> Save As...'],
      ['6. Create a new file'],
      [''],
      [''],
      ['', 'REQUIRED', '', 'OPTIONAL'],
      ['', 'CPN', 'Quantity', 'Ref Des', 'Notes'],
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create instructions worksheet
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    
    // Merge cells for instructions header
    if (!wsInstructions['!merges']) wsInstructions['!merges'] = [];
    wsInstructions['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // INSTRUCTIONS header
      { s: { r: 1, c: 1 }, e: { r: 1, c: 3 } }, // REQUIRED header
      { s: { r: 1, c: 4 }, e: { r: 1, c: 6 } }  // OPTIONAL header
    );

    // Add data rows to instructions sheet
    updateRows.forEach((row, index) => {
      const rowIndex = instructions.length + index;
      XLSX.utils.sheet_add_aoa(wsInstructions, [[
        '',
        row.CPN,
        row.Quantity,
        row['Ref Des'] || '',
        row.Notes || ''
      ]], { origin: rowIndex });
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'DURO Assembly Update');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `DURO_BOM_Update_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);

    console.log(`✅ Successfully generated: ${filename}`);

    // Show success message
    alert(
      `✅ DURO Update File Generated!\n\n` +
      `📄 File: ${filename}\n` +
      `📦 Items: ${itemsToUpdate.length}\n` +
      `📁 Location: Downloads folder\n\n` +
      `Next steps:\n` +
      `1. Open the file in Excel\n` +
      `2. Review the data\n` +
      `3. Import into DURO using their import wizard`
    );

  } catch (error) {
    console.error('Failed to generate DURO update file:', error);
    alert(`❌ Failed to generate DURO update file:\n\n${error}`);
  }
};

/**
 * Generates a SOLIDWORKS action report for items flagged for manual update
 */
export const exportSolidworksActionReport = (
  results: ExcelComparisonResult[],
  solidworksActions: Record<string, boolean>,
  comments: Record<string, string>
): void => {
  try {
    const itemsToFlag = results.filter(item => solidworksActions[item.partNumber]);

    if (itemsToFlag.length === 0) {
      alert('⚠️ No items flagged for SOLIDWORKS update.');
      return;
    }

    // Create report data
    const reportData = itemsToFlag.map(item => ({
      'Part Number': item.partNumber,
      'Current Item #': item.primaryItemNumber || '',
      'DURO Item #': item.secondaryItemNumber || '',
      'Current Qty': item.primaryQuantity || '',
      'DURO Qty': item.secondaryQuantity || '',
      'Issue': item.inPrimaryOnly ? 'Missing in DURO' : 
               item.inSecondaryOnly ? 'Missing in SOLIDWORKS' :
               item.itemNumberIssue ? 'Item Number Mismatch' :
               item.quantityIssue ? 'Quantity Mismatch' : 'Other',
      'Notes': comments[item.partNumber] || '',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'SOLIDWORKS Action Items');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `SOLIDWORKS_Action_Items_${timestamp}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    alert(
      `✅ SOLIDWORKS Action Report Generated!\n\n` +
      `📄 File: ${filename}\n` +
      `📦 Items: ${itemsToFlag.length}\n` +
      `📁 Location: Downloads folder\n\n` +
      `Review this list and manually update SOLIDWORKS BOMs.`
    );

  } catch (error) {
    console.error('Failed to generate SOLIDWORKS report:', error);
    alert(`❌ Failed to generate report:\n\n${error}`);
  }
};
