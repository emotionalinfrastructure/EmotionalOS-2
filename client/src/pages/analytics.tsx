import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, Brain, AlertTriangle } from "lucide-react";
import { AnalyticsPattern } from "@shared/schema";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Analytics() {
  const { data: patterns } = useQuery<AnalyticsPattern[]>({
    queryKey: ["/api/analytics/patterns"],
  });

  const { data: summary } = useQuery<{
    avgIntensity: number;
    trendDirection: "up" | "down" | "stable";
    totalStates: number;
    totalNssiEvents: number;
    weeklyAverage: { day: string; avg: number }[];
  }>({
    queryKey: ["/api/analytics/summary"],
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Pattern recognition and insights from your emotional data
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average State</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-state">
              {summary?.avgIntensity?.toFixed(1) ?? "—"}
            </div>
            <Progress value={summary?.avgIntensity || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend Direction</CardTitle>
            {summary?.trendDirection === "up" ? (
              <TrendingUp className="h-4 w-4 text-chart-2" />
            ) : (
              <TrendingDown className="h-4 w-4 text-chart-3" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize" data-testid="text-trend">
              {summary?.trendDirection || "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total States</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-states">
              {summary?.totalStates || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NSSI Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-nssi">
              {summary?.totalNssiEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Average - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Average Intensity</CardTitle>
            <CardDescription>Daily emotional intensity trends</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.weeklyAverage && summary.weeklyAverage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.weeklyAverage}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                      <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="day" stroke="rgba(148, 163, 184, 0.5)" />
                  <YAxis stroke="rgba(148, 163, 184, 0.5)" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="avg" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No weekly data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pattern Confidence - Takes 1 column */}
        <Card>
          <CardHeader>
            <CardTitle>Pattern Confidence</CardTitle>
            <CardDescription>Detection reliability</CardDescription>
          </CardHeader>
          <CardContent>
            {patterns && patterns.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patterns.slice(0, 5).map((p, i) => ({
                      name: p.patternType,
                      value: (p.confidence || 0) * 100,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {patterns.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No patterns detected
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detected Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Patterns & Insights</CardTitle>
          <CardDescription>AI-powered pattern recognition from your emotional data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patterns && patterns.length > 0 ? (
              patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="p-4 rounded-lg bg-muted/50 hover-elevate transition-all"
                  data-testid={`pattern-${pattern.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold capitalize">{pattern.patternType.replace("_", " ")}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        {new Date(pattern.detectedAt).toLocaleString()}
                      </div>
                    </div>
                    {pattern.confidence && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Confidence: </span>
                        <span className="font-mono font-medium">
                          {(pattern.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 mb-2">{pattern.description}</p>
                  {pattern.recommendation && (
                    <div className="mt-3 p-3 rounded-md bg-primary/10 border border-primary/20">
                      <div className="text-xs font-medium text-primary mb-1">Recommendation</div>
                      <p className="text-sm">{pattern.recommendation}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No patterns detected yet. Keep tracking to unlock insights.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
