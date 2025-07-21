"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceTable, InvoiceTableHandle } from "./components/InvoiceTable";
import { Incoterm } from "@/lib/incotermRules";
import { ValuationTable, ValuationTableHandle } from "./components/ValuationTable";
import { computeFobAndCif, Invoice } from "./lib/valuation";

import { useState, useRef } from "react";
import { useInvoice } from "./contexts/InvoiceContext";
import { LineCalculations } from "./components/LineCalculations";
import { InvoiceLinesTable, InvoiceLinesTableHandle } from "./components/InvoiceLinesTable";

export default function Home() {
  const [incoterm, setIncoterm] = useState<Incoterm>("EXW");
  const { invoiceTotal, currency, tAndI, factor, totalCustomsValue, setTotalCustomsValue, setFactor } = useInvoice();
  const invoiceTableRef = useRef<InvoiceTableHandle>(null);
  const valuationTableRef = useRef<ValuationTableHandle>(null);
  const invoiceLinesTableRef = useRef<InvoiceLinesTableHandle>(null);

  const handleAddLine = () => {
    invoiceLinesTableRef.current?.addLine();
  };

  const handleCalculate = () => {
    const goodsValueAUD = invoiceTableRef.current?.getGoodsValueAUD();
    const valuationElements = valuationTableRef.current?.getValuationElements();

    if (goodsValueAUD === null || goodsValueAUD === undefined) {
      alert("Please enter a valid invoice total");
      return;
    }

    // Create invoice object for calculation
    const invoice: Invoice = {
      incoterm,
      goodsValueAUD,
      elements: valuationElements || {}
    };

    // Compute FOB and CIF using the formula
    const result = computeFobAndCif(invoice);

    // Convert FOB to AUD and update totalCustomsValue
    const exchangeRates = {
      AUD: 1.0,
      USD: 0.6562,
      EUR: 0.565,
      GBP: 0.4866,
      JPY: 96,
      CNY: 4.69,
    } as const;
    
    const exchangeRate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
    const fobInAUD = result.fob / exchangeRate;
    // console.log("fobInAUD", fobInAUD, "result.fob", result.fob, "exchangeRate", exchangeRate);
    setTotalCustomsValue(result.fob);

    // Calculate factor: totalCustomsValue / invoiceTotal
    if (invoiceTotal > 0) {
      const calculatedFactor = result.fob / invoiceTotal;
      setFactor(Math.round((calculatedFactor + Number.EPSILON) * 100000000) / 100000000); // Round to 8 decimal places
    }

    // Update the valuation table with calculated values
    valuationTableRef.current?.updateCalculatedValues(result.fob, result.cif);

    // Also update the InvoiceTable with calculated FOB and CIF amounts
    invoiceTableRef.current?.updateFobCifValues(result.fob, result.cif);
  };


  const handleCalculateLineDistributions = () => {
    // TODO: Implement line distribution calculation
  };

  return (
    <div className="font-sans flex flex-col min-h-screen p-8 sm:p-20 gap-6">
      {/* Tabs */}
      <Tabs defaultValue="headers" className="flex flex-col flex-1 gap-6">
        <TabsList>
          <TabsTrigger value="headers">Invoice Headers</TabsTrigger>
          <TabsTrigger value="lines">Invoice Lines</TabsTrigger>
        </TabsList>

        {/* Invoice Headers Tab */}
        <TabsContent value="headers" className="flex flex-col gap-6 flex-1 overflow-auto">
          {/* Upper grid placeholder (using InvoiceTable for now) */}
          <div className="flex-1 min-h-[200px]">
            <InvoiceTable ref={invoiceTableRef} incoterm={incoterm} onIncotermChange={setIncoterm} />
          </div>

          {/* Valuation Elements Card */}
          <Card className="w-full">
            <CardHeader className="border-b">
              <CardTitle>Valuation Elements</CardTitle>
              <CardAction>
                <Button size="sm" onClick={handleCalculate}>Calculate</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ValuationTable ref={valuationTableRef} incoterm={incoterm} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Lines Tab */}
        <TabsContent value="lines" className="flex flex-col gap-6 flex-1 overflow-auto">
          {/* Invoice Lines grid */}
          <Card className="w-full overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Invoice Lines</CardTitle>
              <CardAction className="flex gap-2">
                <Button size="sm" onClick={handleAddLine}>Add Line</Button>
                <Button size="sm" onClick={handleCalculateLineDistributions}>Calculate Line Distributions</Button>
              </CardAction>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <InvoiceLinesTable ref={invoiceLinesTableRef} />
            </CardContent>
          </Card>

          {/* Lower split view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Line Calculations Card */}
            <Card className="min-h-[200px]">
              <CardHeader className="border-b">
                <CardTitle>Line Calculations</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-auto">
                <LineCalculations />
              </CardContent>
            </Card>

            {/* Calculation Formula Card */}
            <Card className="min-h-[200px]">
              <CardHeader className="border-b">
                <CardTitle>Calculation Formula</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Total:</span>
                      <span className="font-medium">{invoiceTotal.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-medium">{currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Customs Value:</span>
                      <span className="font-medium">{totalCustomsValue.toLocaleString()} AUD</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">T & I:</span>
                      <span className="font-medium">{tAndI.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Factor:</span>
                      <span className="font-medium">{factor.toFixed(8)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
