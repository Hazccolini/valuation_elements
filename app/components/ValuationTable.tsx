import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useInvoice } from "../contexts/InvoiceContext";
import { Incoterm } from "@/lib/incotermRules";
import { ValElement } from "@/lib/incotermRules";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValRow {
  label: string;
  code: string;
  amount: string;
  currency: string;
  distributedBy: string;
  rate: number;
  aud: number;
}

const EXCHANGE_RATES = {
  AUD: 1.0,
  USD: 0.6562,
  EUR: 0.565,
  GBP: 0.4866,
  JPY: 96,
  CNY: 4.69,
};

// (Initial rows will be determined dynamically based on selected Incoterm)

export interface ValuationTableProps {
  incoterm: Incoterm;
}

export interface ValuationTableHandle {
  getValuationElements: () => Partial<Record<ValElement, number>>;
  updateCalculatedValues: (fob: number, cif: number) => void;
}

// Mapping of element code to human-friendly label
const ELEMENT_LABELS: Record<string, string> = {
  // ITL: "Invoice Total (ITL)",
  OFT: "Overseas Freight (OFT)",
  ONS: "Overseas Insurance (ONS)",
  FIF: "Foreign Inland Freight (FIF)",
  PCT: "Packing Costs (PCT)",
  LCH: "Landing Charges (LCH)",
  COM: "Commission (COM)",
  DIS: "Discount (DIS)",
  OTA: "Other Additions (OTA)",
  OTD: "Other Deductions (OTD)",
};

// The rules supplied by user
const INCOTERM_VALUATION_RULES: Record<string, { MANDATORY: string[]; OPTIONAL: string[]; HIDDEN: string[] }> = {
  EXW: {
    MANDATORY: [],
    OPTIONAL: ["FIF", "ONS", "OFT", "OTA"],
    HIDDEN: ["PCT", "LCH", "COM", "DIS", "OTD"],
  },
  FCA: {
    MANDATORY: [],
    OPTIONAL: ["ONS", "OFT"],
    HIDDEN: ["PCT", "FIF", "COM", "OTA", "OTD", "DIS", "LCH"],
  },
  FAS: {
    MANDATORY: [],
    OPTIONAL: ["ONS", "OFT"],
    HIDDEN: ["PCT", "FIF", "COM", "OTA", "OTD", "DIS", "LCH"],
  },
  FOB: {
    MANDATORY: [],
    OPTIONAL: ["ONS", "OFT"],
    HIDDEN: ["PCT", "FIF", "COM", "OTA", "OTD", "DIS", "LCH"],
  },
  CFR: {
    MANDATORY: ["OFT"],
    OPTIONAL: [],
    HIDDEN: ["PCT", "FIF", "ONS", "LCH", "COM", "OTA", "OTD", "DIS"],
  },
  CPT: {
    MANDATORY: ["OFT"],
    OPTIONAL: [],
    HIDDEN: ["PCT", "FIF", "ONS", "LCH", "COM", "OTA", "OTD", "DIS"],
  },
  CIF: {
    MANDATORY: ["ONS", "OFT"],
    OPTIONAL: [],
    HIDDEN: ["PCT", "FIF", "LCH", "COM", "OTA", "OTD", "DIS"],
  },
  CIP: {
    MANDATORY: ["ONS", "OFT"],
    OPTIONAL: [],
    HIDDEN: ["PCT", "FIF", "LCH", "COM", "OTA", "OTD", "DIS"],
  },
  DAP: {
    MANDATORY: ["OFT", "LCH"],
    OPTIONAL: ["ONS"],
    HIDDEN: ["PCT", "FIF", "COM", "OTA", "OTD", "DIS"],
  },
  DPU: {
    MANDATORY: ["OFT", "LCH"],
    OPTIONAL: ["ONS"],
    HIDDEN: ["PCT", "FIF", "COM", "OTA", "OTD", "DIS"],
  },
  DDP: {
    MANDATORY: ["OFT", "LCH"],
    OPTIONAL: ["ONS"],
    HIDDEN: ["PCT", "FIF", "COM", "OTA", "OTD", "DIS"],
  },
  DES: {
    MANDATORY: [],
    OPTIONAL: ["COM", "OTA", "OTD", "DIS", "ONS", "OFT", "LCH"],
    HIDDEN: ["PCT", "FIF"],
  },
  DEQ: {
    MANDATORY: [],
    OPTIONAL: ["COM", "OTA", "OTD", "DIS", "ONS", "OFT", "LCH"],
    HIDDEN: ["PCT", "FIF"],
  },
  DDU: {
    MANDATORY: [],
    OPTIONAL: ["COM", "OTA", "OTD", "DIS", "ONS", "OFT", "LCH"],
    HIDDEN: ["PCT", "FIF"],
  },
  DAT: {
    MANDATORY: [],
    OPTIONAL: ["COM", "OTA", "OTD", "DIS", "ONS", "OFT", "LCH"],
    HIDDEN: ["PCT", "FIF"],
  },
};

// Mapping of internal codes to ValElement codes
const CODE_TO_VAL_ELEMENT: Record<string, ValElement> = {
  FIF: "FIF",
  PCT: "PC",
  COM: "COMM",
  OTA: "OTA",
  OFT: "OFT",
  LCH: "LCH",
  DIS: "DSC",
  OTD: "OTD",
  ONS: "ONS",
};

export const ValuationTable = forwardRef<ValuationTableHandle, ValuationTableProps>(
  function ValuationTable({ incoterm }, ref) {
    const { setTAndI } = useInvoice();

    const buildRow = (code: string): ValRow => {
      const label = ELEMENT_LABELS[code] ?? code;
      const currency = code === "ITL" ? "EUR" : "AUD";
      const rate = EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] ?? 1;
      return { label, code, amount: "", currency, distributedBy: "VAL", rate, aud: 0 };
    };

    const [rows, setRows] = useState<ValRow[]>(() => {
      const rule = INCOTERM_VALUATION_RULES[incoterm];
      const codes = [...rule.MANDATORY, ...rule.OPTIONAL];
      return codes.map(buildRow);
    });

    // Rebuild rows when incoterm changes
    useEffect(() => {
      const rule = INCOTERM_VALUATION_RULES[incoterm];
      const codes = [...rule.MANDATORY, ...rule.OPTIONAL];
      setRows(codes.map(buildRow));
    }, [incoterm]);

    // helper to recalc derived fields for a single row
    const recalc = (row: ValRow): ValRow => {
      const rate = EXCHANGE_RATES[row.currency as keyof typeof EXCHANGE_RATES] ?? 1;
      const amtNumber = parseFloat(row.amount);
      // The rates represent how much one AUD is worth in the foreign currency.
      // To convert a foreign-currency amount back to AUD we DIVIDE by the rate.
      const aud = !Number.isNaN(amtNumber) && rate !== 0
        ? Math.round((amtNumber / rate) * 100) / 100
        : 0;
      return { ...row, rate, aud };
    };

    const handleChange = (index: number, field: "amount" | "currency" | "distributedBy", value: string) => {
      let updatedRows: ValRow[] = [];
      
      setRows((prev) => {
        const clone = [...prev];
        const updated = { ...clone[index], [field]: value } as ValRow;
        clone[index] = recalc(updated);
        updatedRows = clone;
        return clone;
      });
      
      // Update tAndI **after** updating local state to avoid setState during render
      const onsRow = updatedRows.find(r => r.code === 'ONS');
      const oftRow = updatedRows.find(r => r.code === 'OFT');
      
      const onsValue = onsRow ? (parseFloat(onsRow.amount) || 0) : 0;
      const oftValue = oftRow ? (parseFloat(oftRow.amount) || 0) : 0;
      
      setTAndI(onsValue + oftValue);
    };

    const rule = INCOTERM_VALUATION_RULES[incoterm];
    const hiddenOptions = rule.HIDDEN.filter((code) => !rows.some((r) => r.code === code));

    const handleAddElement = (code: string) => {
      if (!code) return;
      setRows((prev) => [...prev, buildRow(code)]);
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getValuationElements() {
        const elements: Partial<Record<ValElement, number>> = {};
        rows.forEach((row) => {
          const valElement = CODE_TO_VAL_ELEMENT[row.code];
          if (valElement && row.aud > 0) {
            elements[valElement] = row.aud;
          }
        });
        return elements;
      },
      updateCalculatedValues(fob: number, cif: number) {
        // Add FOB and CIF as calculated rows if they don't exist
        setRows((prev) => {
          const clone = [...prev];
          
          // Check if FOB row exists, if not add it
          const fobIndex = clone.findIndex(r => r.code === 'FOB');
          if (fobIndex === -1) {
            clone.push({
              label: 'FOB Value (Calculated)',
              code: 'FOB',
              amount: fob.toString(),
              currency: 'AUD',
              distributedBy: 'VAL',
              rate: 1,
              aud: fob
            });
          } else {
            clone[fobIndex] = {
              ...clone[fobIndex],
              amount: fob.toString(),
              aud: fob
            };
          }

          // Check if CIF row exists, if not add it
          const cifIndex = clone.findIndex(r => r.code === 'CIF');
          if (cifIndex === -1) {
            clone.push({
              label: 'CIF Value (Calculated)',
              code: 'CIF',
              amount: cif.toString(),
              currency: 'AUD',
              distributedBy: 'VAL',
              rate: 1,
              aud: cif
            });
          } else {
            clone[cifIndex] = {
              ...clone[cifIndex],
              amount: cif.toString(),
              aud: cif
            };
          }

          return clone;
        });
      }
    }));

    return (
    <ScrollArea className="w-full rounded">
      <Table className="text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Distributed by</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>AUD Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.code}>
              <TableCell className="font-medium whitespace-nowrap">
                {row.label}
              </TableCell>
              <TableCell>
                <input
                  type="number"
                  className="border rounded px-2 py-1 h-8 w-28 bg-background"
                  value={row.amount}
                  onChange={(e) => handleChange(idx, "amount", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <select
                  value={row.currency}
                  onChange={(e) => handleChange(idx, "currency", e.target.value)}
                  className="border rounded px-2 py-1 h-8 w-20 bg-background"
                >
                  {Object.keys(EXCHANGE_RATES).map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                <select
                  value={row.distributedBy}
                  onChange={(e) => handleChange(idx, "distributedBy", e.target.value)}
                  className="border rounded px-2 py-1 h-8 bg-background"
                >
                  <option value="VAL">VAL</option>
                  <option value="Qty">Qty</option>
                  <option value="Wt">Wt</option>
                </select>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.rate.toFixed(4)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.aud ? row.aud.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dropdown to add hidden valuation elements */}
      {hiddenOptions.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="addVal" className="text-sm whitespace-nowrap">
            Add Element
          </label>
          <select
            id="addVal"
            defaultValue=""
            onChange={(e) => {
              handleAddElement(e.target.value);
              e.currentTarget.selectedIndex = 0; // reset
            }}
            className="border rounded px-2 py-1 h-8 bg-background"
          >
            <option value="" disabled>
              Select...
            </option>
            {hiddenOptions.map((code) => (
              <option key={code} value={code}>
                {ELEMENT_LABELS[code] ?? code}
              </option>
            ))}
          </select>
        </div>
      )}
    </ScrollArea>
    );
  }
);
