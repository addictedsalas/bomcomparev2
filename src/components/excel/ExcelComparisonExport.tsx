import React from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ExcelComparisonSummary, ExcelComparisonResult } from '../../models/ExcelComparisonResult';

// Add type definitions for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Helper function to draw checkboxes in PDF
const drawCheckbox = (checked?: boolean): string => {
  // We return a placeholder string, but the actual checkbox is drawn in the cell during rendering
  return checked ? '[X]' : '[ ]';
};

interface ExcelComparisonExportProps {
  results: ExcelComparisonSummary;
  updateSources: Record<string, { pdm: boolean; duro: boolean }>;
  comments?: Record<string, string>;
}

export const ExcelComparisonExport: React.FC<ExcelComparisonExportProps> = ({ 
  results, 
  updateSources,
  comments = {}
}) => {
  // Helper function to get update source for a result
  const getUpdateSource = (result: ExcelComparisonResult) => {
    let issueType = '';
    if (result.inPrimaryOnly || result.inSecondaryOnly) issueType = 'missing';
    else if (result.itemNumberIssue) issueType = 'itemNumber';
    else if (result.quantityIssue) issueType = 'quantity';
    else if (result.descriptionIssue) issueType = 'description';
    
    return updateSources[`${result.partNumber}-${issueType}`] || { pdm: false, duro: false };
  };

  const exportToExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create sheets for each issue type
    if (results.inPrimaryOnly > 0 || results.inSecondaryOnly > 0) {
      const missingPartsData = results.results
        .filter(result => result.inPrimaryOnly || result.inSecondaryOnly)
        .map(result => ({
          'Part Number': result.partNumber,
          'Item Number': result.inPrimaryOnly ? result.primaryItemNumber : result.secondaryItemNumber,
          'Description': result.inPrimaryOnly ? result.primaryDescription : result.secondaryDescription,
          'Quantity': result.inPrimaryOnly ? result.primaryQuantity : result.secondaryQuantity,
          'Missing From': result.inPrimaryOnly ? 'DURO' : 'Primary',
        }));
      
      const missingPartsSheet = XLSX.utils.json_to_sheet(missingPartsData);
      XLSX.utils.book_append_sheet(wb, missingPartsSheet, 'Missing Parts');
    }
    
    if (results.itemNumberIssues > 0) {
      const itemNumberData = results.results
        .filter(result => result.itemNumberIssue)
        .map(result => ({
          'Part Number': result.partNumber,
          'PDM Item #': result.primaryItemNumber,
          'DURO Item #': result.secondaryItemNumber,
          'Update PDM': getUpdateSource(result).pdm ? 'Yes' : 'No',
          'Update DURO': getUpdateSource(result).duro ? 'Yes' : 'No',
        }));
      
      const itemNumberSheet = XLSX.utils.json_to_sheet(itemNumberData);
      XLSX.utils.book_append_sheet(wb, itemNumberSheet, 'Item Number Issues');
    }
    
    if (results.quantityIssues > 0) {
      const quantityData = results.results
        .filter(result => result.quantityIssue)
        .map(result => ({
          'Part Number': result.partNumber,
          'PDM Quantity': result.primaryQuantity,
          'DURO Quantity': result.secondaryQuantity,
          'Update PDM': getUpdateSource(result).pdm ? 'Yes' : 'No',
          'Update DURO': getUpdateSource(result).duro ? 'Yes' : 'No',
        }));
      
      const quantitySheet = XLSX.utils.json_to_sheet(quantityData);
      XLSX.utils.book_append_sheet(wb, quantitySheet, 'Quantity Issues');
    }
    
    if (results.descriptionIssues > 0) {
      const descriptionData = results.results
        .filter(result => result.descriptionIssue)
        .map(result => ({
          'Part Number': result.partNumber,
          'PDM Description': result.primaryDescription,
          'DURO Description': result.secondaryDescription,
          'Update PDM': getUpdateSource(result).pdm ? 'Yes' : 'No',
          'Update DURO': getUpdateSource(result).duro ? 'Yes' : 'No',
        }));
      
      const descriptionSheet = XLSX.utils.json_to_sheet(descriptionData);
      XLSX.utils.book_append_sheet(wb, descriptionSheet, 'Description Issues');
    }
    
    // Create summary sheet
    const summaryData = [
      { 'Metric': 'Total Parts', 'Value': results.totalParts },
      { 'Metric': 'Matching Parts', 'Value': results.matchingParts },
      { 'Metric': 'Item Number Issues', 'Value': results.itemNumberIssues },
      { 'Metric': 'Quantity Issues', 'Value': results.quantityIssues },
      { 'Metric': 'Description Issues', 'Value': results.descriptionIssues },
      { 'Metric': 'In Primary Only', 'Value': results.inPrimaryOnly },
      { 'Metric': 'In DURO Only', 'Value': results.inSecondaryOnly },
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Export the workbook
    XLSX.writeFile(wb, 'excel-comparison-results.xlsx');
  };
  
  const exportToCsv = () => {
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add summary
    csvContent += 'Summary\n';
    csvContent += `Total Parts,${results.totalParts}\n`;
    csvContent += `Matching Parts,${results.matchingParts}\n`;
    csvContent += `Item Number Issues,${results.itemNumberIssues}\n`;
    csvContent += `Quantity Issues,${results.quantityIssues}\n`;
    csvContent += `Description Issues,${results.descriptionIssues}\n`;
    csvContent += `In Primary Only,${results.inPrimaryOnly}\n`;
    csvContent += `In DURO Only,${results.inSecondaryOnly}\n\n`;
    
    // Add missing parts
    if (results.inPrimaryOnly > 0 || results.inSecondaryOnly > 0) {
      csvContent += 'Missing Parts\n';
      csvContent += 'Part Number,Item Number,Description,Quantity,Missing From\n';
      
      results.results
        .filter(result => result.inPrimaryOnly || result.inSecondaryOnly)
        .forEach(result => {
          const source = getUpdateSource(result);
          csvContent += `${result.partNumber},`;
          csvContent += `${result.inPrimaryOnly ? result.primaryItemNumber : result.secondaryItemNumber},`;
          csvContent += `"${result.inPrimaryOnly ? result.primaryDescription : result.secondaryDescription}",`;
          csvContent += `${result.inPrimaryOnly ? result.primaryQuantity : result.secondaryQuantity},`;
          csvContent += `${result.inPrimaryOnly ? 'DURO' : 'Primary'}\n`;
        });
      
      csvContent += '\n';
    }
    
    // Add item number issues
    if (results.itemNumberIssues > 0) {
      csvContent += 'Item Number Issues\n';
      csvContent += 'Part Number,PDM Item #,DURO Item #,Update PDM,Update DURO\n';
      
      results.results
        .filter(result => result.itemNumberIssue)
        .forEach(result => {
          const source = getUpdateSource(result);
          csvContent += `${result.partNumber},`;
          csvContent += `${result.primaryItemNumber},`;
          csvContent += `${result.secondaryItemNumber},`;
          csvContent += `${source.pdm ? 'Yes' : 'No'},`;
          csvContent += `${source.duro ? 'Yes' : 'No'}\n`;
        });
      
      csvContent += '\n';
    }
    
    // Add quantity issues
    if (results.quantityIssues > 0) {
      csvContent += 'Quantity Issues\n';
      csvContent += 'Part Number,PDM Quantity,DURO Quantity,Update PDM,Update DURO\n';
      
      results.results
        .filter(result => result.quantityIssue)
        .forEach(result => {
          const source = getUpdateSource(result);
          csvContent += `${result.partNumber},`;
          csvContent += `${result.primaryQuantity},`;
          csvContent += `${result.secondaryQuantity},`;
          csvContent += `${source.pdm ? 'Yes' : 'No'},`;
          csvContent += `${source.duro ? 'Yes' : 'No'}\n`;
        });
      
      csvContent += '\n';
    }
    
    // Add description issues
    if (results.descriptionIssues > 0) {
      csvContent += 'Description Issues\n';
      csvContent += 'Part Number,PDM Description,DURO Description,Update PDM,Update DURO\n';
      
      results.results
        .filter(result => result.descriptionIssue)
        .forEach(result => {
          const source = getUpdateSource(result);
          csvContent += `${result.partNumber},`;
          csvContent += `"${result.primaryDescription}",`;
          csvContent += `"${result.secondaryDescription}",`;
          csvContent += `${source.pdm ? 'Yes' : 'No'},`;
          csvContent += `${source.duro ? 'Yes' : 'No'}\n`;
        });
    }
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'excel-comparison-results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToPdf = () => {
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(85, 51, 136); // Purple color
    doc.text('Excel BOM Comparison Report', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Add summary
    doc.setFontSize(14);
    doc.setTextColor(85, 51, 136);
    doc.text('Summary', 14, 40);
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Parts', results.totalParts.toString()],
      ['Matching Parts', results.matchingParts.toString()],
      ['Item Number Issues', results.itemNumberIssues.toString()],
      ['Quantity Issues', results.quantityIssues.toString()],
      ['Description Issues', results.descriptionIssues.toString()],
      ['In Primary Only', results.inPrimaryOnly.toString()],
      ['In DURO Only', results.inSecondaryOnly.toString()],
    ];
    
    doc.autoTable({
      startY: 45,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [85, 51, 136], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
    });
    
    let yPos = doc.lastAutoTable.finalY + 15;
    
    // Add missing parts
    if (results.inPrimaryOnly > 0 || results.inSecondaryOnly > 0) {
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(220, 53, 69); // Red color
      doc.text('Missing Parts', 14, yPos);
      
      const missingPartsData = results.results
        .filter(result => result.inPrimaryOnly || result.inSecondaryOnly)
        .map(result => [
          result.partNumber,
          result.inPrimaryOnly ? result.primaryItemNumber : result.secondaryItemNumber,
          result.inPrimaryOnly ? result.primaryDescription : result.secondaryDescription,
          result.inPrimaryOnly ? result.primaryQuantity : result.secondaryQuantity,
          result.inPrimaryOnly ? 'DURO' : 'Primary',
        ]);
      
      doc.autoTable({
        startY: yPos + 5,
        head: [['Part Number', 'Item Number', 'Description', 'Quantity', 'Missing From']],
        body: missingPartsData,
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Add item number issues
    if (results.itemNumberIssues > 0) {
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(255, 193, 7); // Yellow color
      doc.text('Item Number Issues', 14, yPos);
      
      const itemNumberData = results.results
        .filter(result => result.itemNumberIssue)
        .map(result => [
          result.partNumber,
          result.primaryItemNumber,
          result.secondaryItemNumber,
          drawCheckbox(getUpdateSource(result).pdm),
          drawCheckbox(getUpdateSource(result).duro),
        ]);
      
      doc.autoTable({
        startY: yPos + 5,
        head: [['Part Number', 'PDM Item #', 'DURO Item #', 'Update PDM', 'Update DURO']],
        body: itemNumberData,
        theme: 'grid',
        headStyles: { fillColor: [255, 193, 7], textColor: [0, 0, 0] },
        styles: { fontSize: 9 },
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Add quantity issues
    if (results.quantityIssues > 0) {
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(13, 110, 253); // Blue color
      doc.text('Quantity Issues', 14, yPos);
      
      const quantityData = results.results
        .filter(result => result.quantityIssue)
        .map(result => [
          result.partNumber,
          result.primaryQuantity,
          result.secondaryQuantity,
          drawCheckbox(getUpdateSource(result).pdm),
          drawCheckbox(getUpdateSource(result).duro),
        ]);
      
      doc.autoTable({
        startY: yPos + 5,
        head: [['Part Number', 'PDM Quantity', 'DURO Quantity', 'Update PDM', 'Update DURO']],
        body: quantityData,
        theme: 'grid',
        headStyles: { fillColor: [13, 110, 253], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Add description issues
    if (results.descriptionIssues > 0) {
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(85, 51, 136); // Purple color
      doc.text('Description Issues', 14, yPos);
      
      const descriptionData = results.results
        .filter(result => result.descriptionIssue)
        .map(result => [
          result.partNumber,
          result.primaryDescription,
          result.secondaryDescription,
          drawCheckbox(getUpdateSource(result).pdm),
          drawCheckbox(getUpdateSource(result).duro),
        ]);
      
      doc.autoTable({
        startY: yPos + 5,
        head: [['Part Number', 'PDM Description', 'DURO Description', 'Update PDM', 'Update DURO']],
        body: descriptionData,
        theme: 'grid',
        headStyles: { fillColor: [85, 51, 136], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellWidth: 'wrap' },
        columnStyles: {
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
        },
      });
    }
    
    // Save the PDF
    doc.save('excel-comparison-results.pdf');
  };
  
  // Generate action plan based on update preferences
  const generateActionPlan = () => {
    // Prepare data for action plan
    const pdmUpdates = [];
    const duroUpdates = [];

    // Process all non-ignored items with update preferences
    results.results
      .filter(result => !result.ignored)
      .forEach(result => {
        const source = getUpdateSource(result);
        const comment = comments[result.partNumber] || '';

        // Skip if no update preference is set
        if (!source || (!source.pdm && !source.duro)) return;

        // Determine issue type
        let issueType = '';
        if (result.inPrimaryOnly) issueType = 'Missing in DURO';
        else if (result.inSecondaryOnly) issueType = 'Missing in PDM';
        else if (result.itemNumberIssue) issueType = 'Item Number Issue';
        else if (result.quantityIssue) issueType = 'Quantity Issue';
        else if (result.descriptionIssue) issueType = 'Description Issue';
        else return; // Skip if no issue

        // Add to PDM updates
        if (source.pdm) {
          pdmUpdates.push({
            partNumber: result.partNumber,
            issueType,
            currentValue: result.inSecondaryOnly ? 'Missing' :
              result.itemNumberIssue ? result.primaryItemNumber :
              result.quantityIssue ? result.primaryQuantity :
              result.descriptionIssue ? result.primaryDescription : '',
            newValue: result.inSecondaryOnly ? 'Add part' :
              result.itemNumberIssue ? result.secondaryItemNumber :
              result.quantityIssue ? result.secondaryQuantity :
              result.descriptionIssue ? result.secondaryDescription : '',
            comment
          });
        }

        // Add to DURO updates
        if (source.duro) {
          duroUpdates.push({
            partNumber: result.partNumber,
            issueType,
            currentValue: result.inPrimaryOnly ? 'Missing' :
              result.itemNumberIssue ? result.secondaryItemNumber :
              result.quantityIssue ? result.secondaryQuantity :
              result.descriptionIssue ? result.secondaryDescription : '',
            newValue: result.inPrimaryOnly ? 'Add part' :
              result.itemNumberIssue ? result.primaryItemNumber :
              result.quantityIssue ? result.primaryQuantity :
              result.descriptionIssue ? result.primaryDescription : '',
            comment
          });
        }
      });

    // Create action plan content
    let actionPlanContent = `# BOM Comparison Action Plan\n\n`;
    actionPlanContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    // Add PDM updates
    if (pdmUpdates.length > 0) {
      actionPlanContent += `## PDM Updates\n\n`;
      actionPlanContent += `| Part Number | Issue Type | Current Value | New Value | Comments |\n`;
      actionPlanContent += `|------------|------------|---------------|-----------|----------|\n`;
      
      pdmUpdates.forEach(update => {
        actionPlanContent += `| ${update.partNumber} | ${update.issueType} | ${update.currentValue} | ${update.newValue} | ${update.comment} |\n`;
      });
      
      actionPlanContent += `\n`;
    }

    // Add DURO updates
    if (duroUpdates.length > 0) {
      actionPlanContent += `## DURO Updates\n\n`;
      actionPlanContent += `| Part Number | Issue Type | Current Value | New Value | Comments |\n`;
      actionPlanContent += `|------------|------------|---------------|-----------|----------|\n`;
      
      duroUpdates.forEach(update => {
        actionPlanContent += `| ${update.partNumber} | ${update.issueType} | ${update.currentValue} | ${update.newValue} | ${update.comment} |\n`;
      });
      
      actionPlanContent += `\n`;
    }

    // Create download link for action plan
    const blob = new Blob([actionPlanContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOM_Action_Plan_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="flex space-x-3">
      <button
        onClick={exportToExcel}
        className="glass-button px-4 py-2 text-glass flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Excel
      </button>
      
      <button
        onClick={exportToCsv}
        className="glass-button px-4 py-2 text-glass flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        CSV
      </button>
      
      <button
        onClick={exportToPdf}
        className="glass-button px-4 py-2 text-glass flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PDF
      </button>

      <button
        onClick={generateActionPlan}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Action Plan
      </button>
    </div>
  );
};

export { ExcelComparisonExport };
