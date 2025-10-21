import { describe, it, expect } from 'vitest';
import { classifyDocument } from '../category-classifier';

describe('Category Classifier', () => {
  it('should classify financial documents', () => {
    expect(classifyDocument('financial-report.pdf', 'Revenue increased by 15% this quarter. Profit margins improved significantly.')).toBe('financial');
    expect(classifyDocument('balance-sheet.xlsx', 'Assets and liabilities are balanced. Cash flow statement shows positive trends.')).toBe('financial');
    expect(classifyDocument('audit-report.pdf', 'The audit revealed financial regulations and standards.')).toBe('financial');
  });

  it('should classify legal documents', () => {
    expect(classifyDocument('contract.pdf', 'This agreement contains terms and conditions for liability protection.')).toBe('legal');
    expect(classifyDocument('legal-compliance.docx', 'The contract includes indemnity clauses and warranty terms.')).toBe('legal');
    expect(classifyDocument('settlement-agreement.pdf', 'Dispute resolution through litigation process.')).toBe('legal');
  });

  it('should classify commercial documents', () => {
    expect(classifyDocument('pricing-sheet.xlsx', 'Customer pricing and discount rates for sales team.')).toBe('commercial');
    expect(classifyDocument('marketing-plan.pdf', 'Revenue targets and customer acquisition costs.')).toBe('commercial');
    expect(classifyDocument('invoice.pdf', 'Payment terms and transaction fees for client.')).toBe('commercial');
  });

  it('should classify operations documents', () => {
    expect(classifyDocument('safety-manual.pdf', 'Safety procedures and equipment maintenance guide.')).toBe('operations');
    expect(classifyDocument('workflow-guide.docx', 'Process instructions for facility operations.')).toBe('operations');
    expect(classifyDocument('training-manual.pdf', 'Security procedures and logistics workflow.')).toBe('operations');
  });

  it('should classify as other when no keywords match', () => {
    expect(classifyDocument('random-file.txt', 'This is just some random content without specific keywords.')).toBe('other');
    expect(classifyDocument('unknown.pdf', 'Generic document with no identifiable category markers.')).toBe('other');
  });

  it('should handle case-insensitive matching', () => {
    expect(classifyDocument('FINANCIAL-REPORT.PDF', 'REVENUE AND PROFIT MARGINS')).toBe('financial');
    expect(classifyDocument('contract.pdf', 'TERMS AND CONDITIONS FOR LIABILITY')).toBe('legal');
  });

  it('should prioritize highest scoring category', () => {
    // Document with both financial and legal keywords - should pick the one with more matches
    expect(classifyDocument('financial-legal.pdf', 'Revenue profit contract terms liability financial statement')).toBe('financial');
  });
});
