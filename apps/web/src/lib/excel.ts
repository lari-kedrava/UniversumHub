import type ExcelJSTypes from "exceljs";

type SpreadsheetRow = Record<string, unknown>;

function cellText(value: ExcelJSTypes.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value) return String(value.text);
    if ("result" in value) return String(value.result ?? "");
    if ("richText" in value) return value.richText.map((item) => item.text).join("");
  }
  return String(value);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }
  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

export async function readSpreadsheet(file: File): Promise<SpreadsheetRow[]> {
  if (file.name.toLocaleLowerCase().endsWith(".csv")) {
    const [headers = [], ...rows] = parseCsv(await file.text());
    return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  const headers = (worksheet.getRow(1).values as ExcelJSTypes.CellValue[]).slice(1).map(cellText);
  const rows: SpreadsheetRow[] = [];
  worksheet.eachRow((current, rowNumber) => {
    if (rowNumber === 1) return;
    const values = (current.values as ExcelJSTypes.CellValue[]).slice(1);
    const row = Object.fromEntries(headers.map((header, index) => [header, cellText(values[index])]));
    if (Object.values(row).some(Boolean)) rows.push(row);
  });
  return rows;
}

export async function exportSpreadsheet(rows: SpreadsheetRow[], sheetName: string, fileName: string, widths?: number[]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31));
  const headers = Object.keys(rows[0] ?? {});
  worksheet.columns = headers.map((header, index) => ({
    header,
    key: header,
    width: widths?.[index] ?? Math.max(12, header.length + 2),
  }));
  worksheet.addRows(rows);
  worksheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
