import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ExcelComparisonSummary, ExcelComparisonResult } from '../../models/ExcelComparisonResult';
import { generateDuroItemNumberUpdate, previewDuroUpdates } from '../../services/duroExportService';

// Add type definitions for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => void;
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
  originalDuroData?: unknown[] | null;
}

export const ExcelComparisonExport: React.FC<ExcelComparisonExportProps> = ({ 
  results, 
  updateSources,
  originalDuroData
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
  

  const handleDuroItemNumberUpdate = async () => {
    try {
      // Check for quantity issues first
      if (results.quantityIssues > 0) {
        alert(`❌ Cannot generate DURO import file!\n\nThere are ${results.quantityIssues} quantity mismatches that must be resolved first.\n\nPlease review and fix all quantity issues in your BOMs before generating the DURO update file.`);
        return;
      }
      
      const updatesPreview = previewDuroUpdates(results);
      
      if (updatesPreview.length === 0) {
        alert('No item number mismatches found. All item numbers are already synchronized between SOLIDWORKS and DURO.');
        return;
      }

      const confirmMessage = `This will generate a DURO import file to update ${updatesPreview.length} item numbers to match SOLIDWORKS.\n\n📋 Format: Complete DURO BOM with updated item numbers (Item column removed)\n\nUpdates will be:\n${updatesPreview.slice(0, 5).map(u => `• ${u.partNumber}: ${u.secondaryItemNumber} → ${u.primaryItemNumber}`).join('\n')}${updatesPreview.length > 5 ? `\n• ...and ${updatesPreview.length - 5} more` : ''}\n\nContinue?`;
      
      if (confirm(confirmMessage)) {
        await generateDuroItemNumberUpdate(results, originalDuroData as unknown[]);
      }
    } catch (error) {
      console.error('Failed to generate DURO update:', error);
      alert('Failed to generate DURO update file. Please check the console for details.');
    }
  };
  
  return (
    <div className="flex space-x-3">
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
        onClick={handleDuroItemNumberUpdate}
        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Update DURO P/N&apos;s
      </button>
    </div>
  );
};
