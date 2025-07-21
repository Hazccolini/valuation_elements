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
import { LineCalculations } from "./components/LineCalculations";
import { InvoiceLinesTable } from "./components/InvoiceLinesTable";

export default function Home() {
  const [incoterm, setIncoterm] = useState<Incoterm>("EXW");
  const invoiceTableRef = useRef<InvoiceTableHandle>(null);
  const valuationTableRef = useRef<ValuationTableHandle>(null);

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

    // Update the valuation table with calculated values
    valuationTableRef.current?.updateCalculatedValues(result.fob, result.cif);

    // Also update the InvoiceTable with calculated FOB and CIF amounts
    invoiceTableRef.current?.updateFobCifValues(result.fob, result.cif);
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
          <Card className="w-full h-64 overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Invoice Lines</CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <InvoiceLinesTable />
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
              <CardContent className="flex items-center justify-center h-full">
                <span className="text-muted-foreground text-sm">
                  Placeholder for calculation formula
                </span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
