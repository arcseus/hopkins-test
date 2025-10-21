import { describe, it, expect } from 'vitest';
import { aggregateResults, createEmptyAggregate } from '../aggregate';
import { DocResult } from '../../types/analysis';

describe('aggregateResults', () => {
  it('should aggregate results by category', () => {
    const docs: DocResult[] = [
      {
        doc: 'financial-report.pdf',
        category: 'financial',
        facts: ['Revenue increased 10%', 'Profit margin improved'],
        red_flags: ['High debt ratio']
      },
      {
        doc: 'contract.docx',
        category: 'legal',
        facts: ['Contract valid until 2025', 'Includes termination clause'],
        red_flags: ['Unilateral termination rights']
      },
      {
        doc: 'operations-manual.pdf',
        category: 'operations',
        facts: ['Standard procedures documented'],
        red_flags: []
      }
    ];

    const result = aggregateResults(docs);

    expect(result.financial.facts).toBe(2);
    expect(result.financial.red_flags).toBe(1);
    expect(result.legal.facts).toBe(2);
    expect(result.legal.red_flags).toBe(1);
    expect(result.operations.facts).toBe(1);
    expect(result.operations.red_flags).toBe(0);
    expect(result.commercial.facts).toBe(0);
    expect(result.commercial.red_flags).toBe(0);
    expect(result.other.facts).toBe(0);
    expect(result.other.red_flags).toBe(0);
  });

  it('should handle empty document list', () => {
    const result = aggregateResults([]);

    expect(result.financial.facts).toBe(0);
    expect(result.financial.red_flags).toBe(0);
    expect(result.legal.facts).toBe(0);
    expect(result.legal.red_flags).toBe(0);
    expect(result.operations.facts).toBe(0);
    expect(result.operations.red_flags).toBe(0);
    expect(result.commercial.facts).toBe(0);
    expect(result.commercial.red_flags).toBe(0);
    expect(result.other.facts).toBe(0);
    expect(result.other.red_flags).toBe(0);
  });

  it('should handle documents with no facts or red flags', () => {
    const docs: DocResult[] = [
      {
        doc: 'empty-doc.pdf',
        category: 'other',
        facts: [],
        red_flags: []
      }
    ];

    const result = aggregateResults(docs);

    expect(result.other.facts).toBe(0);
    expect(result.other.red_flags).toBe(0);
  });

  it('should accumulate multiple documents in same category', () => {
    const docs: DocResult[] = [
      {
        doc: 'doc1.pdf',
        category: 'financial',
        facts: ['Fact 1'],
        red_flags: ['Flag 1']
      },
      {
        doc: 'doc2.pdf',
        category: 'financial',
        facts: ['Fact 2', 'Fact 3'],
        red_flags: ['Flag 2']
      }
    ];

    const result = aggregateResults(docs);

    expect(result.financial.facts).toBe(3);
    expect(result.financial.red_flags).toBe(2);
  });
});

describe('createEmptyAggregate', () => {
  it('should create empty aggregate with all categories', () => {
    const result = createEmptyAggregate();

    expect(result).toEqual({
      financial: { facts: 0, red_flags: 0 },
      legal: { facts: 0, red_flags: 0 },
      operations: { facts: 0, red_flags: 0 },
      commercial: { facts: 0, red_flags: 0 },
      other: { facts: 0, red_flags: 0 }
    });
  });
});
