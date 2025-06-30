import { ExcelBomData } from "../models/ExcelBomData";
import { ExcelComparisonResult, ExcelComparisonSummary } from "../models/ExcelComparisonResult";
import { areTextsEquivalent, normalizeText } from "../utils/textUtils";

export const compareExcelBoms = (
  primaryBom: ExcelBomData,
  secondaryBom: ExcelBomData
): ExcelComparisonSummary => {
  const results: ExcelComparisonResult[] = [];
  const partNumberMap = new Map<string, boolean>();
  
  // Process all parts from primary BOM
  primaryBom.items.forEach(primaryItem => {
    if (!primaryItem.partNumber) return;
    
    // Normalize part number for comparison
    const normalizedPartNumber = normalizeText(primaryItem.partNumber);
    partNumberMap.set(normalizedPartNumber, true);
    
    // Find matching part in secondary BOM
    const secondaryItem = secondaryBom.items.find(
      item => normalizeText(item.partNumber) === normalizedPartNumber
    );
    
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
  
  return summary;
};
