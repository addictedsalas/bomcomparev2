import * as XLSX from 'xlsx';
import { ExcelComparisonSummary, ExcelComparisonResult } from '../models/ExcelComparisonResult';
import { DuroApiService, DuroChildComponent } from './duroApiService';

export interface DuroUpdateRecord {
  [key: string]: string;
  // Dynamic interface - columns determined at runtime based on template
}

export const syncItemNumbersToDuro = async (
  comparisonResults: ExcelComparisonSummary,
  originalDuroBomData: DuroChildComponent[],
  assemblyId: string
): Promise<boolean> => {
  try {
    // 1. Check for item number issues
    const itemNumberUpdates = new Map<string, string>();
    comparisonResults.results
      .filter(result => 
        result.itemNumberIssue && 
        !result.inPrimaryOnly && 
        !result.inSecondaryOnly
      )
      .forEach(result => {
        if (result.primaryItemNumber) {
          itemNumberUpdates.set(result.partNumber, result.primaryItemNumber);
        }
      });

    if (itemNumberUpdates.size === 0) {
      alert('No item number mismatches found to sync.');
      return false;
    }

    // 2. Confirm with user
    const confirmMessage = `Found ${itemNumberUpdates.size} item number mismatches.\n\n` +
      `This will update the Item Numbers in DURO to match SOLIDWORKS for these components.\n\n` +
      `Are you sure you want to proceed with this API update?`;
    
    if (!confirm(confirmMessage)) {
      return false;
    }

    // 3. Construct updated children list
    // We iterate over the ORIGINAL DURO children to preserve all IDs and existing data
    const updatedChildren = originalDuroBomData.map(child => {
      const partNumber = child.component?.cpn?.displayValue;
      
      // If this part has an update, use the new item number
      if (partNumber && itemNumberUpdates.has(partNumber)) {
        return {
          componentId: child.component.id,
          quantity: child.quantity,
          itemNumber: itemNumberUpdates.get(partNumber)!
        };
      }
      
      // Otherwise keep existing
      return {
        componentId: child.component.id,
        quantity: child.quantity,
        itemNumber: child.itemNumber ? String(child.itemNumber) : ""
      };
    });

    console.log(`Syncing ${updatedChildren.length} children to DURO assembly ${assemblyId}...`);
    console.log('📦 Payload:', updatedChildren);

    // 4. Call API
    await DuroApiService.updateAssemblyBOM(assemblyId, updatedChildren);

    alert(`✅ Successfully synced ${itemNumberUpdates.size} item numbers to DURO!`);
    return true;

  } catch (error: unknown) {
    console.error('Failed to sync to DURO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(`❌ Failed to sync to DURO: ${errorMessage}`);
    return false;
  }
};

export const generateDuroItemNumberUpdate = async (
  comparisonResults: ExcelComparisonSummary,
  originalDuroBomData?: unknown[]
): Promise<void> => {
  try {
    console.log('Starting DURO item number update generation...');
    
    // Check for quantity issues first - these must be resolved before generating DURO updates
    if (comparisonResults.quantityIssues > 0) {
      const quantityIssueCount = comparisonResults.quantityIssues;
      alert(`❌ Cannot generate DURO import file!\n\nThere are ${quantityIssueCount} quantity mismatches that must be resolved first.\n\nPlease review and fix all quantity issues in your BOMs before generating the DURO update file.`);
      return;
    }
    
    // Check if we have the original DURO data
    if (!originalDuroBomData || originalDuroBomData.length === 0) {
      alert('❌ Original DURO BOM data is not available. Please re-upload your DURO file and try again.');
      return;
    }
    
    console.log('📊 Working with original DURO data:', originalDuroBomData.length, 'rows');
    
    // Create a map of part numbers to their correct SOLIDWORKS item numbers
    const itemNumberUpdates = new Map<string, string>();
    comparisonResults.results
      .filter(result => 
        result.itemNumberIssue && 
        !result.inPrimaryOnly && 
        !result.inSecondaryOnly
      )
      .forEach(result => {
        if (result.primaryItemNumber) {
          itemNumberUpdates.set(result.partNumber, result.primaryItemNumber);
        }
      });
    
    console.log(`Found ${itemNumberUpdates.size} item number mismatches to update in DURO`);
    
    if (itemNumberUpdates.size === 0) {
      alert('No item number mismatches found to update in DURO.');
      return;
    }
    
    // Clone the original DURO data and update item numbers (excluding LEVEL = 0 items)
    const updatedDuroData = originalDuroBomData
      .filter(row => {
        const rowData = row as Record<string, unknown>;
        const level = rowData['Level'] || rowData['LEVEL'] || rowData['Lvl'];
        const isLevelZero = level === '0' || Number(level) === 0;
        if (isLevelZero) {
          console.log(`Excluding LEVEL = 0 item from export:`, rowData);
        }
        return !isLevelZero;
      })
      .map(row => {
      const rowData = row as Record<string, unknown>;
      const updatedRow = { ...rowData };
      
      // Get the part number from various possible column names
      const partNumber = rowData['CPN'] || rowData['Part Number'] || rowData['Component'] || rowData['PN'];
      
      // If this part number needs an item number update, apply it
      if (partNumber && itemNumberUpdates.has(String(partNumber))) {
        const newItemNumber = itemNumberUpdates.get(String(partNumber));
        updatedRow['Item Number'] = newItemNumber;
        
        console.log(`Updated ${partNumber}: Item Number = ${newItemNumber}`);
      }
      
      // Remove the 'Item' column (column 1) if it exists
      if ('Item' in updatedRow) {
        delete updatedRow['Item'];
      }
      
      return updatedRow;
    });
    
    // Create workbook with the updated data
    const wb = XLSX.utils.book_new();
    
    // Get column headers from the first row (excluding 'Item' column)
    const headers = Object.keys(updatedDuroData[0] || {});
    console.log('📊 Creating Excel file with columns:', headers);
    
    // Create worksheet with the updated data
    const ws = XLSX.utils.json_to_sheet(updatedDuroData, {
      header: headers
    });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Assembly Updates');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `DURO_ItemNumber_Updates_${timestamp}.xlsx`;
    
    // Download the file
    XLSX.writeFile(wb, filename);
    
    console.log(`Successfully generated DURO update file: ${filename}`);
    
    // Show success message
    alert(`✅ Successfully generated DURO update file!\n\n📄 File: ${filename}\n🔢 Updates: ${itemNumberUpdates.size} item numbers\n📋 Data: Complete DURO BOM with updated item numbers\n\n📁 Check your downloads folder to import this file into DURO.`);
    
  } catch (error) {
    console.error('Failed to generate DURO update file:', error);
    alert(`Failed to generate DURO update file: ${error}`);
  }
};

export const previewDuroUpdates = (
  comparisonResults: ExcelComparisonSummary
): ExcelComparisonResult[] => {
  return comparisonResults.results.filter(result => 
    result.itemNumberIssue && 
    !result.inPrimaryOnly && 
    !result.inSecondaryOnly
  );
};