'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useInvoice } from '../contexts/InvoiceContext';
import { UI_CONFIG, type Incoterm } from '@/lib/incotermRules';

export interface InvoiceRow {
  invoiceNo: string;
  supplier: string;
  invoiceTotal: number;
  currency: string;
  exchangeRate: number;
  fobAmt: number;
  fobCurrency: string;
  cifAmt: number;
  cifCurrency: string;
}

const INITIAL_ROWS: InvoiceRow[] = [
  {
    invoiceNo: 'I-28034125',
    supplier: 'SCS LABORATORIES',
    invoiceTotal: 0,
    currency: '',
    exchangeRate: 0,
    fobAmt: 0,
    fobCurrency: '',
    cifAmt: 0,
    cifCurrency: '',
  },
];

const COLUMNS = [
  { key: 'invoiceNo', label: 'Invoice No.' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'invoiceTotal', label: 'Invoice Total' },
  { key: 'currency', label: 'Currency' },
  { key: 'exchangeRate', label: 'Exchange Rate' },
  { key: 'fobAmt', label: 'FOB Amount' },
  { key: 'fobCurrency', label: 'FOB Currency' },
  { key: 'cifAmt', label: 'CIF Amount' },
  { key: 'cifCurrency', label: 'CIF Currency' },
] as const;

const INCOTERMS = Object.keys(UI_CONFIG) as Incoterm[];

// Add exchange rates mapping and currency list
const EXCHANGE_RATES = {
  AUD: 1.0,
  USD: 0.6562,
  EUR: 0.565,
  GBP: 0.4866,
  JPY: 96,
  CNY: 4.69,
} as const;

const CURRENCIES = Object.keys(EXCHANGE_RATES) as (keyof typeof EXCHANGE_RATES)[];

export interface InvoiceTableProps {
  incoterm: Incoterm;
  onIncotermChange: (term: Incoterm) => void;
}

export interface InvoiceTableHandle {
  getGoodsValueAUD: () => number | null;
  updateFobCifValues: (fob: number, cif: number) => void;
}

export const InvoiceTable = forwardRef<InvoiceTableHandle, InvoiceTableProps>(
  function InvoiceTable({ incoterm, onIncotermChange }: InvoiceTableProps, ref) {
  const [selected, setSelected] = useState<string | null>(null);
  const [rows, setRows] = useState<InvoiceRow[]>(() => INITIAL_ROWS);

  // Access global invoice context setters
  const { setInvoiceTotal, setCurrency } = useInvoice();

  // When the Incoterm changes (selected from the dropdown in this table or from parent),
  // clear out monetary values so the user starts with a clean slate for the new term.
  useEffect(() => {
    setRows(prev =>
      prev.map(r => ({
        ...r,
        invoiceTotal: 0,
        currency: '',
        exchangeRate: 0,
        fobAmt: 0,
        fobCurrency: '',
        cifAmt: 0,
        cifCurrency: '',
      })),
    );
    setSelected(null);
  }, [incoterm]);

  const numericFields: (keyof InvoiceRow)[] = [
    'invoiceTotal',
    'exchangeRate',
    'fobAmt',
    'cifAmt',
  ];

  const handleChange = (
    rowIdx: number,
    field: keyof InvoiceRow,
    value: string,
  ) => {
    let newVal: any = value;
    const isNumeric = numericFields.includes(field);
    if (isNumeric) {
      const parsed = parseFloat(value);
      newVal = Number.isNaN(parsed) ? 0 : parsed;
    }

    setRows(prev => {
      const clone = [...prev];
      const current = clone[rowIdx];
      // Build updated row, and if currency changed, update exchangeRate automatically
      let updatedRow: InvoiceRow = { ...current, [field]: newVal } as InvoiceRow;
      if (field === 'currency') {
        const rate = EXCHANGE_RATES[value as keyof typeof EXCHANGE_RATES] ?? 1;
        updatedRow.exchangeRate = rate;
        // Also update fobCurrency and cifCurrency to match the selected currency
        updatedRow.fobCurrency = value;
        updatedRow.cifCurrency = value;
      }
      clone[rowIdx] = updatedRow;
      return clone;
    });

    // Sync global context **after** updating local state to avoid setState during render
    if (field === 'invoiceTotal') {
      const numVal = typeof newVal === 'number' ? newVal : parseFloat(String(newVal));
      setInvoiceTotal(Number.isNaN(numVal) ? 0 : numVal);
    }
    if (field === 'currency') {
      setCurrency(String(newVal));
    }
  };

  useImperativeHandle(ref, () => ({
    getGoodsValueAUD() {
      if (rows.length === 0) return null;
      const first = rows[0];
      // Convert the invoice total to AUD using the current exchange rate for the row’s currency.
      // If no exchange rate is stored (e.g. currency not selected yet) default to 1.
      const rate = first.exchangeRate || 1;
      const audValue = rate !== 0 ? first.invoiceTotal / rate : 0;
      // Round to 2 dp for consistency with back-end calculations
      return Math.round((audValue + Number.EPSILON) * 100) / 100;
    },
    updateFobCifValues(fob: number, cif: number) {
      setRows(prev => {
        if (prev.length === 0) return prev;
        const clone = [...prev];
        const base = clone[0];

        const currency = base.currency || 'AUD';
        const rate = base.exchangeRate || 1;

        // Convert AUD values to the invoice currency if necessary.
        const needsConversion = currency !== '' && currency !== 'AUD';

        const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

        const fobVal = needsConversion ? round2(fob * rate) : fob;
        const cifVal = needsConversion ? round2(cif * rate) : cif;

        const firstRow = {
          ...base,
          fobAmt: fobVal,
          cifAmt: cifVal,
          fobCurrency: needsConversion ? currency : 'AUD',
          cifCurrency: needsConversion ? currency : 'AUD',
        } as InvoiceRow;

        clone[0] = firstRow;
        return clone;
      });
    },
  }));

  return (
    <Card className="h-full p-4 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* Invoice Terms Dropdown */}
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="incoterm" className="text-sm font-medium whitespace-nowrap">
          Invoice Terms
        </label>
        <select
          id="incoterm"
          value={incoterm}
          onChange={(e) => onIncotermChange(e.target.value as Incoterm)}
          className="border rounded px-2 py-1 h-9 bg-background"
        >
          {INCOTERMS.map((term) => (
            <option key={term} value={term}>
              {term}
            </option>
          ))}
        </select>
      </div>

      <ScrollArea className="w-full h-full rounded">
        <Table className="text-sm w-full">
          <TableHeader className="sticky top-0 bg-background/75 backdrop-blur">
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className="font-semibold whitespace-nowrap">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIdx) => {
              const isSel = row.invoiceNo === selected;
              return (
                <TableRow
                  key={row.invoiceNo}
                  onClick={() => setSelected(row.invoiceNo)}
                  data-state={isSel ? 'selected' : undefined}
                  className={cn('cursor-pointer hover:bg-muted/50', isSel && 'bg-muted')}
                >
                  {COLUMNS.map((col) => {
                    const isNumeric = numericFields.includes(col.key as keyof InvoiceRow);
                    const isCurrency = col.key === 'currency';
                    return (
                      <TableCell key={col.key} className="whitespace-nowrap py-2">
                        {isCurrency ? (
                          <select
                            className="border rounded px-2 py-1 h-8 bg-background w-28"
                            value={String((row as any)[col.key] ?? '')}
                            onChange={e => handleChange(rowIdx, col.key as keyof InvoiceRow, e.target.value)}
                          >
                            {CURRENCIES.map(cur => (
                              <option key={cur} value={cur}>
                                {cur}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={isNumeric ? 'number' : 'text'}
                            className="border rounded px-2 py-1 h-8 bg-background w-28"
                            value={String((row as any)[col.key] ?? '')}
                            onChange={e => handleChange(rowIdx, col.key as keyof InvoiceRow, e.target.value)}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
});
