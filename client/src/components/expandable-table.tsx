/**
 * Expandable table component for document analysis results.
 * 
 * Displays document results in a table format with expandable rows
 * showing detailed facts and red flags for each document.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DocumentResult, DocumentCategory } from '@/types';

interface ExpandableTableProps {
  documents: DocumentResult[];
}

export function ExpandableTable({ documents }: ExpandableTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryBadgeVariant = (category: DocumentCategory) => {
    switch (category) {
      case 'financial':
        return 'default';
      case 'legal':
        return 'secondary';
      case 'commercial':
        return 'outline';
      case 'operations':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCategoryColor = (category: DocumentCategory) => {
    switch (category) {
      case 'financial':
        return 'text-green-600';
      case 'legal':
        return 'text-blue-600';
      case 'commercial':
        return 'text-purple-600';
      case 'operations':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Document Analysis Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No documents analyzed yet. Upload a ZIP file to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Document Analysis Results</span>
          <Badge variant="outline">{documents.length} documents</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Key Facts</TableHead>
                <TableHead>Red Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc, index) => (
                <Collapsible key={index} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(index)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedRows.has(index) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]" title={doc.doc}>
                            {doc.doc}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getCategoryBadgeVariant(doc.category)}
                          className={getCategoryColor(doc.category)}
                        >
                          {doc.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{doc.facts.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">{doc.red_flags.length}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <div className="border-t bg-muted/25 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Key Facts Section */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <h4 className="font-semibold text-sm">Key Facts ({doc.facts.length})</h4>
                                </div>
                                <ul className="space-y-2">
                                  {doc.facts.map((fact, factIndex) => (
                                    <li key={factIndex} className="flex items-start space-x-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                                      <span className="text-sm text-muted-foreground">{fact}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Red Flags Section */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                  <h4 className="font-semibold text-sm">Red Flags ({doc.red_flags.length})</h4>
                                </div>
                                {doc.red_flags.length > 0 ? (
                                  <ul className="space-y-2">
                                    {doc.red_flags.map((flag, flagIndex) => (
                                      <li key={flagIndex} className="flex items-start space-x-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                                        <span className="text-sm text-muted-foreground">{flag}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">
                                    No red flags identified
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
