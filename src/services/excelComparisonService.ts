import { ExcelBomData } from "../models/ExcelBomData";
import { ExcelComparisonResult, ExcelComparisonSummary } from "../models/ExcelComparisonResult";
import { areTextsEquivalent, normalizeText } from "../utils/textUtils";

export const compareExcelBoms = (
  primaryBom: ExcelBomData,
  secondaryBom: ExcelBomData
): ExcelComparisonSummary => {
  console.log('🔍 Starting BOM comparison:');
  console.log(`  Primary BOM: ${primaryBom.items.length} items`);
  console.log(`  Secondary BOM: ${secondaryBom.items.length} items`);
  
  const results: ExcelComparisonResult[] = [];
  const partNumberMap = new Map<string, boolean>();
  
  // Process all parts from primary BOM
  console.log('🔄 Processing Primary BOM items...');
  primaryBom.items.forEach((primaryItem, index) => {
    if (!primaryItem.partNumber) {
      console.log(`  ⚠️  Skipping primary item ${index} - no part number`);
      return;
    }
    
    console.log(`  📝 Processing primary item ${index}: ${primaryItem.partNumber} (Item #: ${primaryItem.itemNumber})`);
    
    // Normalize part number for comparison
    const normalizedPartNumber = normalizeText(primaryItem.partNumber);
    partNumberMap.set(normalizedPartNumber, true);
    
    // Find matching part in secondary BOM
    const secondaryItem = secondaryBom.items.find(
      item => normalizeText(item.partNumber) === normalizedPartNumber
    );
    
    if (secondaryItem) {
      console.log(`    ✅ Found match in DURO: ${secondaryItem.partNumber} (Item #: ${secondaryItem.itemNumber})`);
    } else {
      console.log(`    ❌ No match found in DURO for: ${primaryItem.partNumber}`);
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
        itemNumberIssue: (() => {
          const issueDifferent = !areTextsEquivalent(primaryItem.itemNumber, secondaryItem.itemNumber);
          console.log(`    🔢 Item Number Check for ${primaryItem.partNumber}:`, {
            solidworks: `"${primaryItem.itemNumber}"`,
            duro: `"${secondaryItem.itemNumber}"`,
            areEquivalent: areTextsEquivalent(primaryItem.itemNumber, secondaryItem.itemNumber),
            hasIssue: issueDifferent
          });
          if (issueDifferent) {
            console.log(`    🔸 ITEM NUMBER ISSUE DETECTED for ${primaryItem.partNumber}:`, {
              solidworks: `"${primaryItem.itemNumber}"`,
              duro: `"${secondaryItem.itemNumber}"`,
              normalizedSolidworks: `"${normalizeText(primaryItem.itemNumber)}"`,
              normalizedDuro: `"${normalizeText(secondaryItem.itemNumber)}"`
            });
          }
          return issueDifferent;
        })(),
        quantityIssue: !areTextsEquivalent(primaryItem.quantity, secondaryItem.quantity),
        descriptionIssue: !areTextsEquivalent(primaryItem.description, secondaryItem.description),
      };
      
      console.log(`    ➕ Adding result for ${primaryItem.partNumber} - itemNumberIssue: ${result.itemNumberIssue}`);
      results.push(result);
    } else {
      // Part only in primary BOM
      console.log(`    ➕ Adding missing part result for ${primaryItem.partNumber} (Primary only)`);
      results.push({
        partNumber: primaryItem.partNumber,
        primaryItemNumber: primaryItem.itemNumber,
        primaryQuantity: primaryItem.quantity,
        primaryDescription: primaryItem.description,
        inPrimaryOnly: true,
      });
    }
  });
  
  console.log(`\n📊 After processing primary BOM: ${results.length} results total`);
  
  // Find parts only in secondary BOM
  secondaryBom.items.forEach(secondaryItem => {
    if (!secondaryItem.partNumber) return;
    
    const normalizedPartNumber = normalizeText(secondaryItem.partNumber);
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
  const itemNumberIssuesCount = results.filter(r => r.itemNumberIssue).length;
  const summary: ExcelComparisonSummary = {
    totalParts: results.length,
    matchingParts: results.filter(r => 
      !r.itemNumberIssue && !r.quantityIssue && !r.descriptionIssue && 
      !r.inPrimaryOnly && !r.inSecondaryOnly
    ).length,
    itemNumberIssues: itemNumberIssuesCount,
    quantityIssues: results.filter(r => r.quantityIssue).length,
    descriptionIssues: results.filter(r => r.descriptionIssue).length,
    inPrimaryOnly: results.filter(r => r.inPrimaryOnly).length,
    inSecondaryOnly: results.filter(r => r.inSecondaryOnly).length,
    results: results,
  };
  
  // Debug: Count and list all results with issues
  const itemNumberIssues = results.filter(r => r.itemNumberIssue);
  console.log('\n🔍 DETAILED ANALYSIS:');
  console.log(`📊 Total results: ${results.length}`);
  console.log(`🔢 Item number issues found: ${itemNumberIssues.length}`);
  
  if (itemNumberIssues.length > 0) {
    console.log('\n📋 ALL Item Number Issues:');
    itemNumberIssues.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.partNumber}:`);
      console.log(`     SOLIDWORKS: "${result.primaryItemNumber}"`);
      console.log(`     DURO: "${result.secondaryItemNumber}"`);
    });
  }
  
  console.log('\n📊 Final Comparison Summary:', {
    totalParts: summary.totalParts,
    matchingParts: summary.matchingParts,
    itemNumberIssues: summary.itemNumberIssues,
    quantityIssues: summary.quantityIssues,
    descriptionIssues: summary.descriptionIssues,
    inPrimaryOnly: summary.inPrimaryOnly,
    inSecondaryOnly: summary.inSecondaryOnly
  });
  
  return summary;
};
