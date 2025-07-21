'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

// Define invoice line type for context
export interface InvoiceLineRow {
  mergedLineNo: string;
  lineNo: string;
  invoiceNo: string;
  productCode: string;
  goodsDescription: string;
  lookUpCodeClass: string;
  tariff: string;
  invoiceQty: number;
  unitQuantity: string;
  customsQty: number;
  customsUnit: string;
  price: number;
  lineCurrency: string;
  origin: string;
  prefOrigin: string;
  prefSchemeType: string;
  prefRuleType: string;
  treatmentCode: string;
  instructionType: string;
  instructionNo: string;
  valuationBasis: string;
  tariffRate: string;
  number: string;
  bond: boolean;
  ratio?: number; // Calculated as price / invoiceTotal
}

// Define invoice header type for context
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

// Define the shape of our context value
interface InvoiceContextType {
  invoiceTotal: number;
  setInvoiceTotal: Dispatch<SetStateAction<number>>;
  currency: string;
  setCurrency: Dispatch<SetStateAction<string>>;
  tAndI: number;
  setTAndI: Dispatch<SetStateAction<number>>;
  factor: number;
  setFactor: Dispatch<SetStateAction<number>>;
  totalCustomsValue: number;
  setTotalCustomsValue: Dispatch<SetStateAction<number>>;
  invoiceLines: InvoiceLineRow[];
  setInvoiceLines: Dispatch<SetStateAction<InvoiceLineRow[]>>;
  invoiceHeaders: InvoiceRow[];
  setInvoiceHeaders: Dispatch<SetStateAction<InvoiceRow[]>>;
}

// Create the actual context with an undefined default so we can catch misuse
const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

interface InvoiceProviderProps {
  children: ReactNode;
}

export function InvoiceProvider({ children }: InvoiceProviderProps) {
  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('AUD');
  const [tAndI, setTAndI] = useState<number>(0);
  const [factor, setFactor] = useState<number>(0);
  const [totalCustomsValue, setTotalCustomsValue] = useState<number>(0);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineRow[]>([]);
  const [invoiceHeaders, setInvoiceHeaders] = useState<InvoiceRow[]>([]);

  return (
    <InvoiceContext.Provider value={{ invoiceTotal, setInvoiceTotal, currency, setCurrency, tAndI, setTAndI, factor, setFactor, totalCustomsValue, setTotalCustomsValue, invoiceLines, setInvoiceLines, invoiceHeaders, setInvoiceHeaders }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
} 