export interface ExcelComparisonIssue {
  partNumber: string;
  primaryValue: string;
  secondaryValue: string;
  updatePrimary: boolean;
  updateSecondary: boolean;
  comments?: string;
}

export interface ExcelComparisonResult {
  partNumber: string;
  primaryItemNumber?: string;
  secondaryItemNumber?: string;
  primaryQuantity?: string;
  secondaryQuantity?: string;
  primaryDescription?: string;
  secondaryDescription?: string;
  
  // Issues
  itemNumberIssue?: boolean;
  quantityIssue?: boolean;
  descriptionIssue?: boolean;
  
  // Missing parts
  inPrimaryOnly?: boolean;
  inSecondaryOnly?: boolean;
  
  // Ignore flag
  ignored?: boolean;
}

export interface ExcelComparisonSummary {
  totalParts: number;
  matchingParts: number;
  itemNumberIssues: number;
  quantityIssues: number;
  descriptionIssues: number;
  inPrimaryOnly: number;
  inSecondaryOnly: number;
  results: ExcelComparisonResult[];
}
