import { DocResult, Aggregate, AggregateCounts } from '../types/analysis';

/**
 * Aggregates document analysis results by category.
 * Counts facts and red flags for each document category.
 */
export function aggregateResults(docs: DocResult[]): Aggregate {
  const initial: Aggregate = {
    financial: { facts: 0, red_flags: 0 },
    legal: { facts: 0, red_flags: 0 },
    operations: { facts: 0, red_flags: 0 },
    commercial: { facts: 0, red_flags: 0 },
    other: { facts: 0, red_flags: 0 }
  };

  return docs.reduce((acc, doc) => {
    const category = doc.category;
    acc[category].facts += doc.facts.length;
    acc[category].red_flags += doc.red_flags.length;
    return acc;
  }, initial);
}

/**
 * Creates an empty aggregate structure.
 * Useful for initializing responses when no documents are processed.
 */
export function createEmptyAggregate(): Aggregate {
  return {
    financial: { facts: 0, red_flags: 0 },
    legal: { facts: 0, red_flags: 0 },
    operations: { facts: 0, red_flags: 0 },
    commercial: { facts: 0, red_flags: 0 },
    other: { facts: 0, red_flags: 0 }
  };
}
