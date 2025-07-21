import {
  Incoterm,
  ValElement,
  VAL_RULES,
} from "./incotermRules";

/** Invoice JSON expected from front-end */
export interface Invoice {
  /** Incoterm used on the commercial invoice */
  incoterm: Incoterm;
  /** Invoice price of goods in AUD *excluding* any valuation elements listed below */
  goodsValueAUD: number;
  /** Optional exchange rate – if values are supplied in foreign currency the caller should convert before calling. */
  /**
   * Map of valuation element codes to their monetary values (AUD).
   * Only include an element when it is present on the invoice.
   */
  elements?: Partial<Record<ValElement, number>>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  customsValueAUD?: number;
}

const ADDITIONS: ValElement[] = [
  "PC", // Packing Costs
  "FIF", // Foreign Inland Freight
  "ONS", // Overseas Insurance
  "OFT", // Overseas Freight
  "LCH", // Landing Charges
  "COMM", // Commission
  "OTA", // Other Additions
];

const DEDUCTIONS: ValElement[] = [
  "OTD", // Other Deductions
  "DSC", // Discount
];

/**
 * Validate the supplied invoice JSON against the ABF matrix.
 */
export function validateInvoice(inv: Invoice): ValidationResult {
  const errors: string[] = [];
  const { incoterm, elements = {} } = inv;

  // 1. Check forbidden elements ("X")
  Object.keys(elements).forEach((key) => {
    const el = key as ValElement;
    if (VAL_RULES[incoterm][el] === "X") {
      errors.push(`${el} is not allowed for Incoterm ${incoterm}`);
    }
  });

  // 2. Check mandatory elements ("M")
  Object.entries(VAL_RULES[incoterm]).forEach(([el, rule]) => {
    if (rule === "M") {
      const e = el as ValElement;
      const val = elements[e];
      if (val === undefined || val === null) {
        errors.push(`${e} is mandatory for Incoterm ${incoterm}`);
      }
    }
  });

  // 3. Validate numeric types
  Object.entries(elements).forEach(([el, val]) => {
    if (typeof val !== "number" || Number.isNaN(val)) {
      errors.push(`${el} must be a numeric value`);
    }
  });

  if (typeof inv.goodsValueAUD !== "number" || Number.isNaN(inv.goodsValueAUD)) {
    errors.push("goodsValueAUD must be a numeric value");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // If we reach here we can safely calculate customs value.
  const customsValueAUD = calculateCustomsValue(inv);
  return { valid: true, customsValueAUD };
}

/**
 * Calculate the customs value according to the high-level rule we used previously:
 *
 * customsValue = goodsValue + Σ(Additions) – Σ(Deductions)
 *
 * All inputs are assumed to already be AUD.
 */
export function calculateCustomsValue(inv: Invoice): number {
  const { incoterm, goodsValueAUD: ITOT, elements = {} } = inv;

  const get = (code: ValElement): number => {
    const v = elements[code];
    return typeof v === "number" ? v : 0;
  };

  const FIF = get("FIF");
  const PCT = get("PC");
  const COM = get("COMM");
  const OTA = get("OTA");
  const LCH = get("LCH");
  const DIS = get("DSC");
  const OTD = get("OTD");
  const OFT = get("OFT");
  const ONS = get("ONS");

  let headerCustomsValueAud = 0;

  switch (incoterm) {
    case "EXW":
    case "FCA":
    case "FAS":
    case "FOB":
      headerCustomsValueAud =
        ITOT + (FIF + PCT + COM + OTA) - (LCH + DIS + OTD);
      break;

    case "CFR":
    case "CPT":
      headerCustomsValueAud =
        ITOT + (FIF + PCT + COM + OTA) - (OFT + LCH + DIS + OTD);
      break;

    case "CIF":
    case "CIP":
    case "DAP":
    case "DPU":
    case "DDP":
      headerCustomsValueAud =
        ITOT + (FIF + PCT + COM + OTA) - (OFT + ONS + LCH + DIS + OTD);
      break;

    default:
      headerCustomsValueAud =
        ITOT + (FIF + PCT + COM + OTA) - (LCH + DIS + OTD);
  }

  return round2(headerCustomsValueAud);
}

/* =========================================================================
   4. Incoterm-specific FOB / CIF calculations
   ========================================================================= */

export interface FobCifResult {
  fob: number;
  cif: number;
}

/**
 * Compute FOB and CIF values based on Incoterm and valuation elements.
 * Uses the formulas supplied by the business rules (2024-07-20).
 *
 * All numbers are assumed to be AUD and already rounded to 2dp.
 */
export function computeFobAndCif(inv: Invoice): FobCifResult {
  const { incoterm, goodsValueAUD: ITOT, elements = {} } = inv;

  const get = (code: ValElement): number => {
    const v = elements[code];
    return typeof v === "number" ? v : 0;
  };

  const FIF = get("FIF");
  const PCT = get("PC");
  const COM = get("COMM");
  const OTA = get("OTA");
  const LCH = get("LCH");
  const DIS = get("DSC");
  const OTD = get("OTD");
  const OFT = get("OFT");
  const ONS = get("ONS");

  // ========================= DEBUG LOGS ========================= //
  console.log("=== computeFobAndCif inputs ===", {
    incoterm,
    ITOT,
    FIF,
    PCT,
    COM,
    OTA,
    LCH,
    DIS,
    OTD,
    OFT,
    ONS,
  });
  // ============================================================= //

  let fob = 0;
  console.log("incoterm", incoterm);

  const groupA = new Set<Incoterm>(["EXW", "FCA", "FAS", "FOB"]);
  const groupB = new Set<Incoterm>(["CFR", "CPT"]);
  // Remaining terms fall into groupC per the specification.

  if (groupA.has(incoterm)) {
    console.log("Using Group A formula (EXW/FCA/FAS/FOB)");
    // FOB = ITOT + FIF + PCT + COM + OTA − LCH − DIS − OTD
    fob = ITOT + FIF + PCT + COM + OTA - LCH - DIS - OTD;
  } else if (groupB.has(incoterm)) {
    console.log("Using Group B formula (CFR/CPT)");
    // FOB = ITOT + FIF + PCT + COM + OTA − OFT − LCH − DIS − OTD
    fob = ITOT + FIF + PCT + COM + OTA - OFT - LCH - DIS - OTD;
  } else {
    console.log("Using Group C formula (CIF/CIP/DAP/DPU/DDP and others)");
    // Group C:
    // FOB = ITOT + FIF + PCT + COM + OTA − OFT − ONS − LCH − DIS − OTD
    fob = ITOT + FIF + PCT + COM + OTA - OFT - ONS - LCH - DIS - OTD;
  }

  // CIF = FOB + OFT + ONS
  const cif = fob + OFT + ONS ;

  // ========================= DEBUG LOGS ========================= //
  console.log("=== computeFobAndCif result ===", { fob, cif });
  // ============================================================= //

  return {
    fob: round2(fob),
    cif: round2(cif),
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface DeclarationLine {
  id: string;
  itot: number;
  weight: number;
  qty: number;
  dutyRate: number;
}

export type AllocationMethod = "Value" | "Weight" | "Quantity" | "Manual";

export interface DeclarationPayload {
  incoterm: Incoterm;
  k?: number | null; // ONS factor, default 0.0025
  fxRate: number;
  valuation: {
    ITOT: number;
    FIF?: number; // same as input
    PCT?: number;
    COM?: number;
    OTA?: number;
    OFT?: number;
    LCH?: number;
    DIS?: number;
    OTS?: number;
  };
  lines: DeclarationLine[];
  allocationMethod: AllocationMethod;
  manualSplits?: Record<string, number>;
}

/**
 * Map external valuation element codes to internal canonical codes.
 */
const CODE_MAP: Record<string, ValElement> = {
  FIF: "FIF",
  PCT: "PC",
  COM: "COMM",
  OTA: "OTA",
  OFT: "OFT",
  LCH: "LCH",
  DIS: "DSC",
  OTS: "OTD",
};

export function processDeclaration(payload: DeclarationPayload): ValidationResult {
  const { incoterm, fxRate, k } = payload; // fxRate retained for audit – not used now
  const onsFactor = k == null ? 0.0025 : k;

  const elements: Partial<Record<ValElement, number>> = {};

  // Compute ONS first – based on ITOT and k
  const goodsValue = payload.valuation.ITOT;
  const onsValue = round2(goodsValue * onsFactor);
  elements["ONS"] = onsValue;

  // Map other valuation elements
  Object.entries(payload.valuation).forEach(([code, value]) => {
    if (code === "ITOT") return; // handled separately
    const numericValue = value ?? 0;
    if (numericValue === 0) return; // treat zero as absent
    const canonical = CODE_MAP[code as keyof typeof CODE_MAP];
    if (canonical) {
      elements[canonical] = numericValue;
    }
  });

  const invoice: Invoice = {
    incoterm,
    goodsValueAUD: goodsValue,
    elements,
  };

  return validateInvoice(invoice);
} 