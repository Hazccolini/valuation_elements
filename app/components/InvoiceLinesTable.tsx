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
import { useState } from "react";

export interface InvoiceLineRow {
  mergedLineNo: string;
  lineNo: string;
  invoiceNo: string;
  productCode: string;
  goodsDescription: string;
  lookUpCodeClass: string;
  tariff: string;
  invoiceQty: number;
  unitQuantity: string; // UQ
  customsQty: number;
  customsUnit: string; // Cust.
  price: number;
  lineCurrency: string;
  origin: string; // ORG
  prefOrigin: string;
  prefSchemeType: string;
  prefRuleType: string;
  treatmentCode: string;
  instructionType: string;
  instructionNo: string;
  valuationBasis: string;
  tariffRate: string;
  number: string; // "No." column
  bond: boolean;
}

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
    customsQty: 7160.0,
    customsUnit: "KG",
    price: 101672.0,
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
  { key: "mergedLineNo", label: "Merged Ln #" },
  { key: "lineNo", label: "LNO" },
  { key: "invoiceNo", label: "Inv. No." },
  { key: "productCode", label: "Product Code" },
  { key: "goodsDescription", label: "Goods Description" },
  { key: "lookUpCodeClass", label: "Look Up Code Class." },
  { key: "tariff", label: "Tariff" },
  { key: "invoiceQty", label: "Inv. Qty" },
  { key: "unitQuantity", label: "UQ" },
  { key: "customsQty", label: "Customs Qty" },
  { key: "customsUnit", label: "Cust." },
  { key: "price", label: "Price" },
  { key: "lineCurrency", label: "Line Curren" },
  { key: "origin", label: "ORG" },
  { key: "prefOrigin", label: "Pref. Origin" },
  { key: "prefSchemeType", label: "Pref. Scheme T" },
  { key: "prefRuleType", label: "Pref. Rule Type" },
  { key: "treatmentCode", label: "Treatment Code" },
  { key: "instructionType", label: "Inst. Type" },
  { key: "instructionNo", label: "Inst. No." },
  { key: "valuationBasis", label: "Valuation Basis" },
  { key: "tariffRate", label: "Tariff Rate" },
  { key: "number", label: "No." },
  { key: "bond", label: "Bond?" },
] as const;

const numericFields: (keyof InvoiceLineRow)[] = [
  "invoiceQty",
  "customsQty",
  "price",
];

export function InvoiceLinesTable() {
  const [rows, setRows] = useState<InvoiceLineRow[]>(() => INITIAL_ROWS);

  const handleChange = (
    rowIdx: number,
    field: keyof InvoiceLineRow,
    value: string | boolean,
  ) => {
    setRows((prev) => {
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
          {rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
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
} 