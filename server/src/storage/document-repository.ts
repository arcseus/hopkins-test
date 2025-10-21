/**
 * Document repository interface for dependency inversion
 * Allows different storage implementations (local, S3, database, etc.)
 */
export interface DocumentRepository {
  saveAnalysis(analysisId: string, data: any): Promise<void>;
  getAnalysis(analysisId: string): Promise<any>;
}

/**
 * Local file system implementation of DocumentRepository
 * Stores analysis results in /output/analysis_id.json
 */
export class LocalDocumentRepository implements DocumentRepository {
  private readonly outputDir = './output';

  async saveAnalysis(analysisId: string, data: any): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Save analysis to file
    const filePath = path.join(this.outputDir, `${analysisId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async getAnalysis(analysisId: string): Promise<any> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.outputDir, `${analysisId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }
}
