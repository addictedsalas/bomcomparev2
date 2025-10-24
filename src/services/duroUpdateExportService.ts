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

    // Check if any items have item number issues
    const hasItemNumberIssues = itemsToUpdate.some(item => item.itemNumberIssue);

    // Create update rows in DURO format
    const updateRows = itemsToUpdate.map(item => {
      // Convert part number to DURO format (with duplicated suffix)
      const duroPartNumber = toDuroFormat(item.partNumber);
      
      // Use SOLIDWORKS values as the source of truth
      const quantity = item.primaryQuantity || item.secondaryQuantity || '1';
      const itemNumber = item.primaryItemNumber || item.secondaryItemNumber || '';
      const notes = comments[item.partNumber] || '';

      console.log(`  - ${item.partNumber} → ${duroPartNumber} (Qty: ${quantity}, Item #: ${itemNumber})`);

      // Build row object dynamically based on whether we need Item Number column
      const row: Record<string, string> = {
        CPN: duroPartNumber,
        Quantity: quantity,
      };

      // Only include Item Number column if there are item number issues
      if (hasItemNumberIssues) {
        row['Item Number'] = itemNumber;
      }

      // Add optional columns
      row['Ref Des'] = '';
      row.Notes = notes;

      return row;
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from JSON (headers and values only)
    const ws = XLSX.utils.json_to_sheet(updateRows);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'DURO Assembly Update');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `DURO_BOM_Update_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);

    console.log(`✅ Successfully generated: ${filename}`);

    // Show success message
    const columns = hasItemNumberIssues 
      ? 'CPN, Quantity, Item Number, Ref Des, Notes'
      : 'CPN, Quantity, Ref Des, Notes';
    
    alert(
      `✅ DURO Update File Generated!\n\n` +
      `📄 File: ${filename}\n` +
      `📦 Items: ${itemsToUpdate.length}\n` +
      `📋 Columns: ${columns}\n` +
      `📁 Location: Downloads folder\n\n` +
      `Ready to import into DURO!`
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
