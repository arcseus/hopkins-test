/**
 * Main application component for document analysis.
 * 
 * Integrates all components into a single-page application with
 * file upload, analysis progress, results display, and export functionality.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadBox } from '@/components/upload-box';
import { SummaryCards } from '@/components/summary-cards';
import { ExpandableTable } from '@/components/expandable-table';
import { DocumentAnalysisApiClient } from '@/services';
import { validateFileUpload } from '@/utils';
import { toast } from 'sonner';
import { Download, FileText, AlertCircle } from 'lucide-react';
import type { AnalyseResponse } from '@/types';

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalyseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiClient = new DocumentAnalysisApiClient({
    baseUrl: 'http://localhost:3000',
    timeout: 180000 // 3 minutes
  });

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentFile(0);
    setTotalFiles(0);

    try {
      // Simulate progress updates (in real app, you'd get these from the server)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Make API call
      const result = await apiClient.analyseDocuments(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Simulate file processing count
      setTotalFiles(result.docs.length);
      setCurrentFile(result.docs.length);
      
      setAnalysisResult(result);
      toast.success(`Analysis complete! Processed ${result.docs.length} documents.`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    if (!analysisResult?.analysisId) {
      toast.error('No analysis results to download');
      return;
    }

    try {
      const blob = await apiClient.downloadMarkdown({ 
        analysisId: analysisResult.analysisId 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document_analysis_report.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Markdown report downloaded successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Document Analysis</h1>
          <p className="text-lg text-muted-foreground">
            Upload a ZIP file containing documents for AI-powered analysis
          </p>
        </div>

        {/* Upload Section */}
        <UploadBox
          onFileSelect={handleFileSelect}
          isAnalyzing={isAnalyzing}
          progress={progress}
          currentFile={currentFile}
          totalFiles={totalFiles}
          error={error || undefined}
        />

        {/* Results Section */}
        {analysisResult && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Analysis Summary</h2>
              <SummaryCards 
                aggregate={analysisResult.aggregate}
                totalDocuments={analysisResult.docs.length}
              />
            </div>

            {/* Download Button */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Export Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Download a comprehensive markdown report of the analysis
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Includes all documents, facts, and red flags
                    </p>
                  </div>
                  <Button onClick={handleDownloadMarkdown} className="ml-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download Markdown
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Document Table */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Document Details</h2>
              <ExpandableTable documents={analysisResult.docs} />
            </div>

            {/* Errors Display */}
            {analysisResult.errors.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>Processing Errors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.errors.map((error, index) => (
                      <li key={index} className="text-sm text-destructive">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysisResult && !isAnalyzing && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground">
                Upload a ZIP file containing your documents to begin the analysis process.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
