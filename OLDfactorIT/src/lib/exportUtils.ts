import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Exports data to an Excel file
 * @param data Array of objects to export
 * @param filename Base filename without extension
 * @param sheetName Name of the worksheet
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate filename with date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fullFilename = `${filename}_${dateStr}.xlsx`;

    // Write and download file
    XLSX.writeFile(wb, fullFilename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

/**
 * Exports data to a CSV file
 * @param data Array of objects to export
 * @param filename Base filename without extension
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Convert to CSV
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Generate filename with date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fullFilename = `${filename}_${dateStr}.csv`;
    
    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}