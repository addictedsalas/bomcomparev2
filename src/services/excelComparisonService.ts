import { ExcelBomData } from "../models/ExcelBomData";
import { ExcelComparisonResult, ExcelComparisonSummary } from "../models/ExcelComparisonResult";
import { areTextsEquivalent, normalizePartNumber } from "../utils/textUtils";

export const compareExcelBoms = (
  primaryBom: ExcelBomData,
  secondaryBom: ExcelBomData
): ExcelComparisonSummary => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 BOM COMPARISON STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`SOLIDWORKS BOM: ${primaryBom.items.length} items`);
  console.log(`DURO BOM: ${secondaryBom.items.length} items`);
  console.log('───────────────────────────────────────────────────────────\n');
  
  const results: ExcelComparisonResult[] = [];
  const partNumberMap = new Map<string, boolean>();
  
  // Process all parts from primary BOM
  primaryBom.items.forEach((primaryItem, index) => {
    if (!primaryItem.partNumber) {
      return;
    }
    
    // Normalize part number for comparison (handles DURO's suffix issues)
    const normalizedPartNumber = normalizePartNumber(primaryItem.partNumber);
    partNumberMap.set(normalizedPartNumber, true);
    
    // Find matching part in secondary BOM
    const secondaryItem = secondaryBom.items.find(
      item => normalizePartNumber(item.partNumber) === normalizedPartNumber
    );
    
    // Log first 5 comparisons with detailed info
    if (index < 5) {
      console.log(`\n[COMPARISON ${index + 1}]`);
      console.log(`SOLIDWORKS: "${primaryItem.partNumber}"`);
      console.log(`  → Normalized: "${normalizedPartNumber}"`);
      
      if (secondaryItem) {
        console.log(`DURO: "${secondaryItem.partNumber}"`);
        console.log(`  → Normalized: "${normalizePartNumber(secondaryItem.partNumber)}"`);
        console.log(`✅ MATCH FOUND`);
      } else {
        console.log(`DURO: NOT FOUND`);
        console.log(`❌ NO MATCH`);
        
        // Show what's available in DURO for debugging
        const similarParts = secondaryBom.items
          .filter(item => item.partNumber.toLowerCase().includes(primaryItem.partNumber.toLowerCase().substring(0, 8)))
          .slice(0, 3);
        if (similarParts.length > 0) {
          console.log(`  Similar parts in DURO:`);
          similarParts.forEach(part => {
            console.log(`    - "${part.partNumber}" → normalized: "${normalizePartNumber(part.partNumber)}"`);
          });
        }
      }
    }
    
    if (secondaryItem) {
      // Part exists in both BOMs - check for differences
      const result: ExcelComparisonResult = {
        partNumber: primaryItem.partNumber,
        primaryItemNumber: primaryItem.itemNumber,
        secondaryItemNumber: secondaryItem.itemNumber,
        primaryQuantity: primaryItem.quantity,
        secondaryQuantity: secondaryItem.quantity,
        primaryDescription: primaryItem.description,
        secondaryDescription: secondaryItem.description,
        
        // Check for issues using normalized comparison
        itemNumberIssue: !areTextsEquivalent(primaryItem.itemNumber, secondaryItem.itemNumber),
        quantityIssue: !areTextsEquivalent(primaryItem.quantity, secondaryItem.quantity),
        descriptionIssue: !areTextsEquivalent(primaryItem.description, secondaryItem.description),
      };
      
      results.push(result);
    } else {
      // Part only in primary BOM
      results.push({
        partNumber: primaryItem.partNumber,
        primaryItemNumber: primaryItem.itemNumber,
        primaryQuantity: primaryItem.quantity,
        primaryDescription: primaryItem.description,
        inPrimaryOnly: true,
      });
    }
  });
  
  
  // Find parts only in secondary BOM
  secondaryBom.items.forEach(secondaryItem => {
    if (!secondaryItem.partNumber) return;
    
    const normalizedPartNumber = normalizePartNumber(secondaryItem.partNumber);
    if (!partNumberMap.has(normalizedPartNumber)) {
      results.push({
        partNumber: secondaryItem.partNumber,
        secondaryItemNumber: secondaryItem.itemNumber,
        secondaryQuantity: secondaryItem.quantity,
        secondaryDescription: secondaryItem.description,
        inSecondaryOnly: true,
      });
    }
  });
  
  // Calculate summary statistics
  const summary: ExcelComparisonSummary = {
    totalParts: results.length,
    matchingParts: results.filter(r => 
      !r.itemNumberIssue && !r.quantityIssue && !r.descriptionIssue && 
      !r.inPrimaryOnly && !r.inSecondaryOnly
    ).length,
    itemNumberIssues: results.filter(r => r.itemNumberIssue).length,
    quantityIssues: results.filter(r => r.quantityIssue).length,
    descriptionIssues: results.filter(r => r.descriptionIssue).length,
    inPrimaryOnly: results.filter(r => r.inPrimaryOnly).length,
    inSecondaryOnly: results.filter(r => r.inSecondaryOnly).length,
    results: results,
  };
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 COMPARISON SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Parts: ${summary.totalParts}`);
  console.log(`✅ Matching: ${summary.matchingParts}`);
  console.log(`❌ Missing in SOLIDWORKS: ${summary.inSecondaryOnly}`);
  console.log(`❌ Missing in DURO: ${summary.inPrimaryOnly}`);
  console.log(`⚠️  Item Number Issues: ${summary.itemNumberIssues}`);
  console.log(`⚠️  Quantity Issues: ${summary.quantityIssues}`);
  console.log(`⚠️  Description Issues: ${summary.descriptionIssues}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  return summary;
};
