"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useInvoice, InvoiceLineRow } from "../contexts/InvoiceContext";
import { cn } from "@/lib/utils";

// Export the type from context for backward compatibility
export type { InvoiceLineRow } from "../contexts/InvoiceContext";

const INITIAL_ROWS: InvoiceLineRow[] = [
  {
    mergedLineNo: "1/FIECP/X6",
    lineNo: "1",
    invoiceNo: "I-28034125",
    productCode: "FRIED SHALLOTS",
    goodsDescription: "ROYLES BRAND FRIED SHALLOT - 10 ...",
    lookUpCodeClass: "SESON",
    tariff: "2103.90.00 17",
    invoiceQty: 716,
    unitQuantity: "NO",
    customsQty: 0,
    customsUnit: "KG",
    price: 0,
    lineCurrency: "MYR",
    origin: "MY",
    prefOrigin: "",
    prefSchemeType: "",
    prefRuleType: "",
    treatmentCode: "",
    instructionType: "",
    instructionNo: "",
    valuationBasis: "001",
    tariffRate: "",
    number: "",
    bond: false,
  },
];

const COLUMNS = [
  // { key: "mergedLineNo", label: "Merged Ln #" },
  { key: "lineNo", label: "LNO" },
  { key: "invoiceNo", label: "Inv. No." },
  // { key: "productCode", label: "Product Code" },
  // { key: "goodsDescription", label: "Goods Description" },
  // { key: "lookUpCodeClass", label: "Look Up Code Class." },
  { key: "tariff", label: "Tariff" },
  // { key: "invoiceQty", label: "Inv. Qty" },
  // { key: "unitQuantity", label: "UQ" },
  // { key: "customsQty", label: "Customs Qty" },
  // { key: "customsUnit", label: "Cust." },
  { key: "price", label: "Price" },
  { key: "lineCurrency", label: "Line Currency" },
  { key: "origin", label: "ORG" },
  // { key: "prefOrigin", label: "Pref. Origin" },
  // { key: "prefSchemeType", label: "Pref. Scheme T" },
  // { key: "prefRuleType", label: "Pref. Rule Type" },
  // { key: "treatmentCode", label: "Treatment Code" },
  // { key: "instructionType", label: "Inst. Type" },
  // { key: "instructionNo", label: "Inst. No." },
  // { key: "valuationBasis", label: "Valuation Basis" },
  { key: "tariffRate", label: "Tariff Rate" },
  // { key: "number", label: "No." },
  { key: "bond", label: "Bond?" },
] as const;

const numericFields: (keyof InvoiceLineRow)[] = [
  "invoiceQty",
  "customsQty",
  "price",
];

export interface InvoiceLinesTableHandle {
  addLine: () => void;
}

export const InvoiceLinesTable = forwardRef<InvoiceLinesTableHandle>(
  function InvoiceLinesTable(props, ref) {
  const { invoiceLines, setInvoiceLines } = useInvoice();
  const [rows, setRows] = useState<InvoiceLineRow[]>(() => INITIAL_ROWS);
  const [selected, setSelected] = useState<string | null>(null);

  // Initialize context with initial rows on first load
  useEffect(() => {
    if (invoiceLines.length === 0) {
      setInvoiceLines(INITIAL_ROWS);
    }
  }, [invoiceLines.length, setInvoiceLines]);

  // Use context data if available, otherwise fall back to local state
  const currentRows = invoiceLines.length > 0 ? invoiceLines : rows;

  const addLine = () => {
    const newLineNo = (currentRows.length + 1).toString();
    const newRow: InvoiceLineRow = {
      mergedLineNo: `${newLineNo}/NEW/X`,
      lineNo: newLineNo,
      invoiceNo: "I-28034125", // Default to same invoice
      productCode: "",
      goodsDescription: "",
      lookUpCodeClass: "",
      tariff: "",
      invoiceQty: 0,
      unitQuantity: "NO",
      customsQty: 0,
      customsUnit: "KG",
      price: 0,
      lineCurrency: "MYR",
      origin: "",
      prefOrigin: "",
      prefSchemeType: "",
      prefRuleType: "",
      treatmentCode: "",
      instructionType: "",
      instructionNo: "",
      valuationBasis: "001",
      tariffRate: "",
      number: "",
      bond: false,
    };
    setInvoiceLines(prev => [...prev, newRow]);
  };

  useImperativeHandle(ref, () => ({
    addLine,
  }));

  const handleChange = (
    rowIdx: number,
    field: keyof InvoiceLineRow,
    value: string | boolean,
  ) => {
    setInvoiceLines((prev) => {
      const clone = [...prev];
      const current = clone[rowIdx];
      let newVal: any = value;
      if (numericFields.includes(field as keyof InvoiceLineRow)) {
        const parsed = parseFloat(String(value));
        newVal = Number.isNaN(parsed) ? 0 : parsed;
      }
      clone[rowIdx] = { ...current, [field]: newVal };
      return clone;
    });
  };

  return (
    <ScrollArea className="w-full h-full rounded">
      <Table className="text-sm w-full">
        <TableHeader className="sticky top-0 bg-background/75 backdrop-blur">
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className="font-semibold whitespace-nowrap text-xs"
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentRows.map((row, rowIdx) => (
            <TableRow
              key={rowIdx}
              onClick={() => setSelected(row.lineNo)}
              data-state={row.lineNo === selected ? "selected" : undefined}
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                row.lineNo === selected && "bg-primary/20 font-medium"
              )}
            >
              {COLUMNS.map((col) => {
                if (col.key === "bond") {
                  return (
                    <TableCell key={col.key} className="text-center">
                      <input
                        type="checkbox"
                        checked={row.bond}
                        onChange={(e) => handleChange(rowIdx, "bond", e.target.checked)}
                      />
                    </TableCell>
                  );
                }

                const isNumeric = numericFields.includes(col.key as keyof InvoiceLineRow);
                return (
                  <TableCell key={col.key} className="p-1 whitespace-nowrap">
                    <input
                      type={isNumeric ? "number" : "text"}
                      className="border rounded px-1 py-0.5 h-7 bg-background w-28 text-xs"
                      value={String((row as any)[col.key] ?? "")}
                      onChange={(e) =>
                        handleChange(rowIdx, col.key as keyof InvoiceLineRow, e.target.value)
                      }
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}); 