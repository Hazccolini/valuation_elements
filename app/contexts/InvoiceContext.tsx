'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

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

  return (
    <InvoiceContext.Provider value={{ invoiceTotal, setInvoiceTotal, currency, setCurrency, tAndI, setTAndI, factor, setFactor, totalCustomsValue, setTotalCustomsValue }}>
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