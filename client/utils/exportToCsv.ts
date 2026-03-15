export type CsvRow = Record<string, string | number | null | undefined>;

const escapeValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsEscaping = str.includes(",") || str.includes('"') || str.includes("\n");
  if (!needsEscaping) return str;
  return `"${str.replace(/"/g, '""')}"`;
};

export const exportToCsv = (filename: string, rows: CsvRow[]): void => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escapeValue(row[key])).join(",")),
  ];

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

