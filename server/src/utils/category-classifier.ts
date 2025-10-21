/**
 * Document category classifier using filename and content analysis
 * Pre-classifies documents before LLM processing for better efficiency
 */

import { DocumentCategory } from '../types/analysis';

/**
 * Keyword maps for each document category
 * Each category has 10-15 targeted keywords for fast classification
 */
const CATEGORY_KEYWORDS: Record<DocumentCategory, string[]> = {
  financial: [
    'revenue', 'profit', 'income', 'expense', 'balance sheet', 'cash flow', 'audit', 'financial statement',
    'budget', 'forecast', 'ebitda', 'assets', 'liabilities', 'equity', 'p&l', 'quarterly', 'earnings'
  ],
  legal: [
    'contract', 'agreement', 'liability', 'indemnity', 'warranty', 'clause', 'legal', 'compliance', 
    'regulation', 'litigation', 'dispute', 'settlement', 'jurisdiction', 'court', 'law'
  ],
  commercial: [
    'pricing', 'price', 'cost', 'fee', 'rate', 'discount', 'marketing', 'sales', 'customer', 'client',
    'deal', 'transaction', 'purchase', 'order', 'invoice', 'payment', 'quotation'
  ],
  operations: [
    'process', 'procedure', 'workflow', 'operation', 'manual', 'guide', 'instruction', 'training',
    'safety', 'security', 'maintenance', 'equipment', 'facility', 'logistics', 'supply chain'
  ],
  other: [] // Fallback category
};

/**
 * Classifies document category based on filename and content
 * 
 * @param filename - Document filename
 * @param content - First 300 characters of document content
 * @returns DocumentCategory - Classified category
 */
export function classifyDocument(filename: string, content: string): DocumentCategory {
  // Combine filename and content for analysis
  const text = `${filename} ${content}`.toLowerCase();
  
  // Score each category based on keyword matches
  const scores: Record<DocumentCategory, number> = {
    financial: 0,
    legal: 0,
    commercial: 0,
    operations: 0,
    other: 0
  };
  
  // Count keyword matches for each category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue; // Skip scoring 'other'
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category as DocumentCategory]++;
      }
    }
  }
  
  // Find category with highest score
  const maxScore = Math.max(...Object.values(scores));
  
  // If no keywords matched, return 'other'
  if (maxScore === 0) {
    return 'other';
  }
  
  // Return category with highest score
  return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as DocumentCategory || 'other';
}
