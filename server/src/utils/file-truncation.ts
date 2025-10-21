/**
 * File truncation utilities for different document types.
 * Implements content-aware truncation to stay within processing limits.
 */

import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { PROCESSING_LIMITS } from './constants';

export interface TruncationResult {
  text: string;
  truncated: boolean;
  originalLength: number;
  metadata?: {
    rows?: number;
    sheets?: number;
    columns?: string[];
  };
}

/**
 * Normalizes text by cleaning up whitespace, line endings, and control characters
 * This helps maximize token efficiency before truncation
 */
function normalizeText(text: string): string {
  return text
    .replace(/\u0000/g, '')            // strip NULs
    .replace(/\r\n/g, '\n')            // windows -> unix
    .replace(/[^\S\n]+/g, ' ')         // collapse runs of spaces/tabs (not newlines)
    .replace(/\n{3,}/g, '\n\n')        // max 2 blank lines
    .trim();
}

/**
 * Truncates text to the maximum allowed length while preserving word boundaries
 * Applies text normalization first to maximize token efficiency
 */
function truncateText(text: string, maxLength: number): TruncationResult {
  // Normalize text first to save space and improve token efficiency
  const normalizedText = normalizeText(text);
  
  if (normalizedText.length <= maxLength) {
    return {
      text: normalizedText,
      truncated: false,
      originalLength: text.length
    };
  }

  // Reserve space for ellipsis
  const availableLength = maxLength - 3;
  const truncated = normalizedText.substring(0, availableLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  const finalText = lastSpaceIndex > availableLength * 0.8 
    ? truncated.substring(0, lastSpaceIndex)
    : truncated;

  return {
    text: finalText + '...',
    truncated: true,
    originalLength: text.length
  };
}

/**
 * Extracts and truncates text from PDF documents
 */
export async function truncatePDF(buffer: Buffer): Promise<TruncationResult> {
  try {
    // Use require for pdf-parse due to module structure
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    const text = data.text;
    
    return truncateText(text, PROCESSING_LIMITS.MAX_TEXT_LENGTH);
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts and truncates text from DOCX documents
 * Preserves paragraph structure and formatting
 */
export async function truncateDOCX(buffer: Buffer): Promise<TruncationResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return truncateText(text, PROCESSING_LIMITS.MAX_TEXT_LENGTH);
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts and truncates data from XLSX spreadsheets
 * Limits to 200 rows and flattens to text format
 */
export async function truncateXLSX(buffer: Buffer): Promise<TruncationResult> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    let allText = '';
    let totalRows = 0;
    const maxRows = 200;
    
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Limit rows per sheet
      const limitedData = jsonData.slice(0, maxRows - totalRows);
      totalRows += limitedData.length;
      
      // Convert to text format
      const sheetText = limitedData
        .map((row: unknown) => (row as any[]).join('\t'))
        .join('\n');
      
      allText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
      
      if (totalRows >= maxRows) break;
    }
    
    return {
      text: truncateText(allText, PROCESSING_LIMITS.MAX_TEXT_LENGTH).text,
      truncated: totalRows >= maxRows,
      originalLength: allText.length,
      metadata: {
        rows: totalRows,
        sheets: sheetNames.length,
        columns: sheetNames
      }
    };
  } catch (error) {
    throw new Error(`XLSX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts and truncates data from CSV files
 * Limits to 200 rows and flattens to text format
 */
export async function truncateCSV(buffer: Buffer): Promise<TruncationResult> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    const maxRows = 200;
    
    const stream = Readable.from(buffer);
    
    stream
      .pipe(csv({ headers: true }))
      .on('data', (row: any) => {
        if (rows.length < maxRows) {
          rows.push(row);
        }
      })
      .on('end', () => {
        try {
          // Convert to text format
          const text = rows
            .map(row => Object.values(row).join('\t'))
            .join('\n');
          
          const result = truncateText(text, PROCESSING_LIMITS.MAX_TEXT_LENGTH);
          
          resolve({
            ...result,
            metadata: {
              rows: rows.length,
              columns: rows.length > 0 ? Object.keys(rows[0]) : []
            }
          });
        } catch (error) {
          reject(new Error(`CSV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      })
      .on('error', (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      });
  });
}

/**
 * Truncates plain text files
 */
export async function truncateTXT(buffer: Buffer): Promise<TruncationResult> {
  try {
    const text = buffer.toString('utf-8');
    return truncateText(text, PROCESSING_LIMITS.MAX_TEXT_LENGTH);
  } catch (error) {
    throw new Error(`TXT processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main dispatcher function for file truncation based on file type
 */
export async function truncateFile(buffer: Buffer, fileType: string): Promise<TruncationResult> {
  const extension = fileType.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return await truncatePDF(buffer);
    case 'docx':
      return await truncateDOCX(buffer);
    case 'xlsx':
      return await truncateXLSX(buffer);
    case 'csv':
      return await truncateCSV(buffer);
    case 'txt':
      return await truncateTXT(buffer);
    default:
      throw new Error(`Unsupported file type for truncation: ${fileType}`);
  }
}
