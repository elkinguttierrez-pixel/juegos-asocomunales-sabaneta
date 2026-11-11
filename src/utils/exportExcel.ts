/**
 * Utility for exporting data to Excel (.xlsx) on-demand using dynamic import.
 * This prevents bundling the heavy xlsx library into the initial application bundle.
 */
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  sheetName: string,
  fileName: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}
