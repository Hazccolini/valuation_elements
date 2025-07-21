import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvoice } from '../contexts/InvoiceContext';

interface FieldRow {
  key: string;
  label: string;
  value: string;
  currency?: string; // optional for % lines
}

const CURRENT_INVOICE_FIELDS: FieldRow[] = [
  { key: "total", label: "Total Amount", value: "" },
  // { key: "currency", label: "Currency", value: "" },
  { key: "lines", label: "Lines Amount", value: "" },
  { key: "balance", label: "Balance", value: "" },
];

const LINE_CALC_FIELDS: FieldRow[] = [
  { key: "customs", label: "Customs Value", value: "" },
  { key: "freight", label: "Freight", value: "" },
  { key: "insurance", label: "Insurance", value: "" },
  { key: "cif", label: "CIF Value", value: "" },
  { key: "tni", label: "T & I", value: "" },
  { key: "duty", label: "Duty", value: "" },
  { key: "gst", label: "GST Amount", value: "" },
  { key: "dutyRate", label: "Duty Rate(%)", value: "" },
  { key: "flatRate", label: "Flat Rate", value: "" },
];

export function LineCalculations() {
  const { invoiceTotal, currency } = useInvoice();
  const [currentInv, setCurrentInv] = useState<FieldRow[]>(CURRENT_INVOICE_FIELDS);
  const [lineCalcs, setLineCalcs] = useState<FieldRow[]>(LINE_CALC_FIELDS);

  const handleChange = (
    setFn: React.Dispatch<React.SetStateAction<FieldRow[]>>,
    idx: number,
    field: "value" | "currency",
    value: string,
  ) => {
    setFn((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], [field]: value } as FieldRow;
      return clone;
    });
  };

  const renderTable = (
    rows: FieldRow[],
    setFn: React.Dispatch<React.SetStateAction<FieldRow[]>>,
    title?: string,
  ) => (
    <Table className="text-sm w-full">
      {title && (
        <TableHeader>
          <TableRow>
            <TableHead colSpan={3} className="font-semibold whitespace-nowrap">
              {title}
            </TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={row.key}>
            <TableCell className="whitespace-nowrap font-medium">
              {row.label}
            </TableCell>
            <TableCell className="p-1">
              {row.key === 'total' ? (
                <input
                  type="number"
                  className="border rounded px-2 py-1 h-8 w-28 bg-background text-right"
                  value={invoiceTotal.toString()}
                  readOnly
                />
              ) : (
                <input
                  type="number"
                  className="border rounded px-2 py-1 h-8 w-28 bg-background text-right"
                  value={row.value}
                  onChange={(e) => handleChange(setFn, idx, "value", e.target.value)}
                />
              )}
            </TableCell>
            <TableCell className="p-1">
              {row.key === 'currency' ? (
                <input
                  type="text"
                  className="border rounded px-2 py-1 h-8 w-16 bg-background uppercase"
                  value={currency}
                  readOnly
                />
              ) : row.label.includes("Rate") ? (
                <span>%</span>
              ) : (
                <input
                  type="text"
                  className="border rounded px-2 py-1 h-8 w-16 bg-background uppercase"
                  value={row.currency ?? "AUD"}
                  onChange={(e) => handleChange(setFn, idx, "currency", e.target.value)}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-4">
      {renderTable(currentInv, setCurrentInv, "Current Invoice")}
      {renderTable(lineCalcs, setLineCalcs, "Line Calculations (Without Override)")}
    </div>
  );
} 