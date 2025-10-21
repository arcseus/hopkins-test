/**
 * Upload box component with progress indicator.
 * 
 * Provides a clean interface for file upload with progress tracking
 * and visual feedback during the analysis process.
 */

import { useState, useRef } from 'react';
// Removed unused imports
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  progress: number;
  currentFile: number;
  totalFiles: number;
  error?: string;
}

export function UploadBox({ 
  onFileSelect, 
  isAnalyzing, 
  progress, 
  currentFile, 
  totalFiles, 
  error 
}: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      onFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isAnalyzing ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary/50'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
              disabled={isAnalyzing}
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isAnalyzing ? 'Analyzing Documents...' : 'Upload Document Package'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAnalyzing 
                    ? `Processing ${currentFile} of ${totalFiles} files...`
                    : 'Drag and drop a ZIP file here, or click to browse'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analysis Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* File Info */}
          {!isAnalyzing && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Only ZIP files are supported</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
