export type Incoterm =
  | "EXW" | "FCA" | "FAS" | "FOB"
  | "CFR" | "CPT" | "CIF" | "CIP"
  | "DAP" | "DAT" | "DPU" | "DDP" // added DAT
  | "DES" | "DEQ" | "DDU"; // legacy terms

export type ValElement =
  | "PC"    // Packing Costs
  | "FIF"   // Foreign Inland Freight
  | "ONS"   // Overseas Insurance
  | "OFT"   // Overseas Freight
  | "LCH"   // Landing Charges
  | "COMM"  // Commission
  | "OTA"   // Other Additions
  | "OTD"   // Other Deductions
  | "DSC";  // Discount

export type ValRule = "M" | "O" | "X";

/* =========================================================================
   1. Validation Rules (ABF ICS)
   ========================================================================= */
export const VAL_RULES: Record<Incoterm, Record<ValElement, ValRule>> = {
  EXW: { PC:"O", FIF:"O", ONS:"O", OFT:"O", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  FCA: { PC:"O", FIF:"O", ONS:"O", OFT:"O", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  FAS: { PC:"X", FIF:"X", ONS:"O", OFT:"O", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  FOB: { PC:"X", FIF:"X", ONS:"O", OFT:"O", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },

  CFR: { PC:"X", FIF:"X", ONS:"O", OFT:"M", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  CPT: { PC:"X", FIF:"X", ONS:"O", OFT:"M", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },

  CIF: { PC:"X", FIF:"X", ONS:"M", OFT:"M", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  CIP: { PC:"X", FIF:"X", ONS:"M", OFT:"M", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },

  DAP: { PC:"X", FIF:"X", ONS:"O", OFT:"M", LCH:"M", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  DAT: { PC:"X", FIF:"X", ONS:"O", OFT:"M", LCH:"M", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  DPU: { PC:"X", FIF:"X", ONS:"O", OFT:"M", LCH:"M", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  DDP: { PC:"X", FIF:"X", ONS:"O", OFT:"M", LCH:"M", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },

  DES: { PC:"O", FIF:"X", ONS:"O", OFT:"O", LCH:"X", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  DEQ: { PC:"O", FIF:"X", ONS:"O", OFT:"O", LCH:"M", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
  DDU: { PC:"O", FIF:"X", ONS:"O", OFT:"O", LCH:"M", COMM:"O", OTA:"O", OTD:"O", DSC:"O" },
};

/* =========================================================================
   2. Displaying Rules (UI)
   =========================================================================
   These rules determine which fields are fixed (always shown) on screen
   and which are pre-marked as mandatory for better UX.
   ========================================================================= */
export interface IncotermUI {
  fixed: ValElement[];     // default fields shown
  mandatory: ValElement[]; // visually required (UI star)
}

export const UI_CONFIG: Record<Incoterm, IncotermUI> = {
  // --- Current ---
  EXW: { fixed: ["FIF","OFT","ONS","OTA"],      mandatory: [] },
  FCA: { fixed: ["OFT","ONS"],                  mandatory: [] },
  FAS: { fixed: ["OFT","ONS"],                  mandatory: [] },
  FOB: { fixed: ["OFT","ONS"],                  mandatory: [] },
  CFR: { fixed: ["OFT"],                        mandatory: ["OFT"] },
  CPT: { fixed: ["OFT"],                        mandatory: ["OFT"] },
  CIF: { fixed: ["OFT","ONS"],                  mandatory: ["OFT","ONS"] },
  CIP: { fixed: ["OFT","ONS"],                  mandatory: ["OFT","ONS"] },
  DAP: { fixed: ["OFT","ONS","LCH"],            mandatory: ["OFT","LCH"] },
  DAT: { fixed: ["OFT","ONS","LCH"],            mandatory: ["OFT","LCH"] },
  DPU: { fixed: ["OFT","ONS","LCH"],            mandatory: ["OFT","LCH"] },
  DDP: { fixed: ["OFT","ONS","LCH"],            mandatory: ["OFT","LCH"] },

  // --- Legacy ---
  DES: { fixed: ["OFT","ONS"],                  mandatory: [] },
  DEQ: { fixed: ["OFT","ONS","LCH"],            mandatory: ["LCH"] },
  DDU: { fixed: ["OFT","ONS","LCH"],            mandatory: ["LCH"] },
};

/* =========================================================================
   3. Helpers
   ========================================================================= */
export const ALL_VAL_ELEMENTS: ValElement[] = ["PC","FIF","ONS","OFT","LCH","COMM","OTA","OTD","DSC"];

export function elementIsAllowed(term: Incoterm, el: ValElement): boolean {
  return VAL_RULES[term][el] !== "X";
}

export function elementIsMandatory(term: Incoterm, el: ValElement): boolean {
  return VAL_RULES[term][el] === "M";
} 