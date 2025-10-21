/**
 * Summary cards component displaying analysis statistics.
 * 
 * Shows aggregated counts across all document categories with
 * visual indicators and proper categorization.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';
import type { AnalysisAggregate } from '@/types';

interface SummaryCardsProps {
  aggregate: AnalysisAggregate;
}

export function SummaryCards({ aggregate }: SummaryCardsProps) {
  const categories = [
    {
      key: 'financial' as const,
      label: 'Financial',
      icon: TrendingUp,
      color: 'bg-green-500',
      badge: 'success'
    },
    {
      key: 'legal' as const,
      label: 'Legal',
      icon: FileText,
      color: 'bg-blue-500',
      badge: 'secondary'
    },
    {
      key: 'commercial' as const,
      label: 'Commercial',
      icon: Building2,
      color: 'bg-purple-500',
      badge: 'outline'
    },
    {
      key: 'operations' as const,
      label: 'Operations',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      badge: 'destructive'
    }
  ];

  const totalFacts = Object.values(aggregate).reduce((sum, cat) => sum + cat.facts, 0);
  const totalRedFlags = Object.values(aggregate).reduce((sum, cat) => sum + cat.red_flags, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Category Cards */}
      {categories.map((category) => {
        const Icon = category.icon;
        const data = aggregate[category.key];
        
        return (
          <Card key={category.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{data.facts}</div>
                  <Badge variant="outline" className="text-xs">
                    Facts
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-destructive">{data.red_flags}</div>
                  <Badge variant="destructive" className="text-xs">
                    Red Flags
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${category.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {category.label} documents
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
