import {
  processDeclaration,
  DeclarationPayload,
  ValidationResult,
} from '../app/lib/valuation';

// Main entry to run validation & customs value calc
export function runCalculation(payload: DeclarationPayload): ValidationResult {
  return processDeclaration(payload);
}

// Simple proportional distributor – extend as needed
export function distributeToLines(
  totals: number[],
  method: 'Value' | 'Weight' | 'Quantity' | 'Manual',
  manual?: number[]
): number[] {
  if (method === 'Manual' && manual) return manual;

  const sum = totals.reduce((a, b) => a + b, 0);
  if (!sum) return totals.map(() => 0);

  return totals.map((t) => t / sum);
} 