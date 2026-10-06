import ExcelJS from "exceljs";

const xlsxMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const spreadsheetAccept = `.csv,.xlsx,text/csv,${xlsxMimeType}`;

export function isXlsxFile(file: File) {
  return file.name.toLowerCase().endsWith(".xlsx");
}

export function isSpreadsheetFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".xlsx");
}

function toCsvValue(text: string) {
  return text.replace(/[,\r\n]+/g, " ").trim();
}

export async function readSpreadsheetAsCsv(file: File): Promise<string> {
  if (!isXlsxFile(file)) return file.text();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = workbook.worksheets[0];
  if (!sheet) return "";

  const lines: string[] = [];
  sheet.eachRow((row) => {
    const values: string[] = [];
    for (let column = 1; column <= sheet.columnCount; column++) {
      values.push(toCsvValue(row.getCell(column).text));
    }
    if (values.some(Boolean)) lines.push(values.join(","));
  });

  return lines.join("\n");
}
