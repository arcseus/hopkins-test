import { describe, it, expect } from 'vitest';
import { 
  DocResultSchema, 
  AggregateCountsSchema, 
  AggregateSchema,
  AnalyseResponseSchema,
  validateDocResult,
  validateAnalyseResponse
} from '../analysis';

describe('DocResultSchema', () => {
  it('should validate valid doc result', () => {
    const validDoc = {
      doc: 'test.pdf',
      category: 'financial',
      facts: ['Revenue increased', 'Profit margin improved'],
      red_flags: ['High debt ratio']
    };

    expect(() => DocResultSchema.parse(validDoc)).not.toThrow();
  });

  it('should reject invalid category', () => {
    const invalidDoc = {
      doc: 'test.pdf',
      category: 'invalid',
      facts: ['Revenue increased'],
      red_flags: []
    };

    expect(() => DocResultSchema.parse(invalidDoc)).toThrow();
  });

  it('should reject too many facts', () => {
    const invalidDoc = {
      doc: 'test.pdf',
      category: 'financial',
      facts: ['Fact 1', 'Fact 2', 'Fact 3', 'Fact 4', 'Fact 5', 'Fact 6'],
      red_flags: []
    };

    expect(() => DocResultSchema.parse(invalidDoc)).toThrow();
  });

  it('should reject too many red flags', () => {
    const invalidDoc = {
      doc: 'test.pdf',
      category: 'financial',
      facts: [],
      red_flags: ['Flag 1', 'Flag 2', 'Flag 3', 'Flag 4', 'Flag 5', 'Flag 6']
    };

    expect(() => DocResultSchema.parse(invalidDoc)).toThrow();
  });

  it('should reject facts that are too long', () => {
    const longFact = 'a'.repeat(301);
    const invalidDoc = {
      doc: 'test.pdf',
      category: 'financial',
      facts: [longFact],
      red_flags: []
    };

    expect(() => DocResultSchema.parse(invalidDoc)).toThrow();
  });

  it('should reject red flags that are too long', () => {
    const longFlag = 'a'.repeat(301);
    const invalidDoc = {
      doc: 'test.pdf',
      category: 'financial',
      facts: [],
      red_flags: [longFlag]
    };

    expect(() => DocResultSchema.parse(invalidDoc)).toThrow();
  });

  it('should reject empty document name', () => {
    const invalidDoc = {
      doc: '',
      category: 'financial',
      facts: [],
      red_flags: []
    };

    expect(() => DocResultSchema.parse(invalidDoc)).toThrow();
  });
});

describe('AggregateCountsSchema', () => {
  it('should validate valid counts', () => {
    const validCounts = { facts: 5, red_flags: 3 };
    expect(() => AggregateCountsSchema.parse(validCounts)).not.toThrow();
  });

  it('should reject negative counts', () => {
    const invalidCounts = { facts: -1, red_flags: 0 };
    expect(() => AggregateCountsSchema.parse(invalidCounts)).toThrow();
  });

  it('should reject non-integer counts', () => {
    const invalidCounts = { facts: 1.5, red_flags: 0 };
    expect(() => AggregateCountsSchema.parse(invalidCounts)).toThrow();
  });
});

describe('AggregateSchema', () => {
  it('should validate complete aggregate', () => {
    const validAggregate = {
      financial: { facts: 2, red_flags: 1 },
      legal: { facts: 3, red_flags: 0 },
      operations: { facts: 1, red_flags: 2 },
      commercial: { facts: 0, red_flags: 0 },
      other: { facts: 1, red_flags: 1 }
    };

    expect(() => AggregateSchema.parse(validAggregate)).not.toThrow();
  });

  it('should reject missing categories', () => {
    const invalidAggregate = {
      financial: { facts: 2, red_flags: 1 },
      legal: { facts: 3, red_flags: 0 }
      // Missing other categories
    };

    expect(() => AggregateSchema.parse(invalidAggregate)).toThrow();
  });
});

describe('AnalyseResponseSchema', () => {
  it('should validate complete response', () => {
    const validResponse = {
      docs: [
        {
          doc: 'test.pdf',
          category: 'financial',
          facts: ['Revenue increased'],
          red_flags: ['High debt']
        }
      ],
      aggregate: {
        financial: { facts: 1, red_flags: 1 },
        legal: { facts: 0, red_flags: 0 },
        operations: { facts: 0, red_flags: 0 },
        commercial: { facts: 0, red_flags: 0 },
        other: { facts: 0, red_flags: 0 }
      },
      summaryText: 'Test summary',
      errors: []
    };

    expect(() => AnalyseResponseSchema.parse(validResponse)).not.toThrow();
  });

  it('should reject invalid docs array', () => {
    const invalidResponse = {
      docs: [
        {
          doc: 'test.pdf',
          category: 'invalid',
          facts: [],
          red_flags: []
        }
      ],
      aggregate: {
        financial: { facts: 0, red_flags: 0 },
        legal: { facts: 0, red_flags: 0 },
        operations: { facts: 0, red_flags: 0 },
        commercial: { facts: 0, red_flags: 0 },
        other: { facts: 0, red_flags: 0 }
      },
      summaryText: '',
      errors: []
    };

    expect(() => AnalyseResponseSchema.parse(invalidResponse)).toThrow();
  });
});

describe('validation helpers', () => {
  it('validateDocResult should return parsed result', () => {
    const validDoc = {
      doc: 'test.pdf',
      category: 'financial',
      facts: ['Revenue increased'],
      red_flags: ['High debt']
    };

    const result = validateDocResult(validDoc);
    expect(result).toEqual(validDoc);
  });

  it('validateAnalyseResponse should return parsed result', () => {
    const validResponse = {
      docs: [],
      aggregate: {
        financial: { facts: 0, red_flags: 0 },
        legal: { facts: 0, red_flags: 0 },
        operations: { facts: 0, red_flags: 0 },
        commercial: { facts: 0, red_flags: 0 },
        other: { facts: 0, red_flags: 0 }
      },
      summaryText: '',
      errors: []
    };

    const result = validateAnalyseResponse(validResponse);
    expect(result).toEqual(validResponse);
  });
});
