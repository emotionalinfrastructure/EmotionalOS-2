import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter } from "lucide-react";
import { EmotionalState, NssiEvent } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

export default function History() {
  const [dateRange, setDateRange] = useState("7");
  const [filterType, setFilterType] = useState("all");

  const { data: emotionalStates } = useQuery<EmotionalState[]>({
    queryKey: [`/api/emotional-states?days=${dateRange}`],
  });

  const { data: nssiEvents } = useQuery<NssiEvent[]>({
    queryKey: [`/api/nssi-events?days=${dateRange}`],
  });

  // Prepare chart data
  const chartData =
    emotionalStates?.map((state) => ({
      timestamp: new Date(state.timestamp).getTime(),
      intensity: state.intensity,
      valence: state.valence,
      arousal: state.arousal,
      date: new Date(state.timestamp).toLocaleDateString(),
      time: new Date(state.timestamp).toLocaleTimeString(),
    })) || [];

  // Event markers for the chart
  const eventMarkers =
    nssiEvents?.map((event) => ({
      timestamp: new Date(event.timestamp).getTime(),
      value: event.severity * 10,
    })) || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">History</h1>
          <p className="text-muted-foreground mt-2">Multi-day emotional state tracking and event analysis</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-range">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="emotional">Emotional States</SelectItem>
              <SelectItem value="nssi">NSSI Events</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Multi-day Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Emotional Intensity Over Time</CardTitle>
          <CardDescription>Track patterns and trends with event markers</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="intensityGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                    <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  stroke="rgba(148, 163, 184, 0.5)"
                />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="url(#intensityGradient)"
                  strokeWidth={3}
                  dot={{ fill: "rgb(59, 130, 246)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {eventMarkers.map((marker, i) => (
                  <ReferenceDot
                    key={i}
                    x={marker.timestamp}
                    y={marker.value}
                    r={8}
                    fill="rgb(251, 191, 36)"
                    stroke="rgb(245, 158, 11)"
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No data available for selected range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotional States */}
        {(filterType === "all" || filterType === "emotional") && (
          <Card>
            <CardHeader>
              <CardTitle>Emotional States</CardTitle>
              <CardDescription>{emotionalStates?.length || 0} entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {emotionalStates?.slice(0, 20).map((state) => (
                  <div
                    key={state.id}
                    className="p-4 rounded-lg bg-muted/50 hover-elevate transition-all cursor-pointer"
                    data-testid={`state-${state.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">Intensity: {state.intensity.toFixed(1)}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {new Date(state.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-x-4">
                      <span>Valence: {state.valence.toFixed(1)}</span>
                      <span>Arousal: {state.arousal.toFixed(1)}</span>
                    </div>
                    {state.note && (
                      <p className="text-sm mt-2 text-foreground/80">{state.note}</p>
                    )}
                  </div>
                ))}
                {(!emotionalStates || emotionalStates.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No emotional states recorded</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NSSI Events */}
        {(filterType === "all" || filterType === "nssi") && (
          <Card>
            <CardHeader>
              <CardTitle>NSSI Events</CardTitle>
              <CardDescription>{nssiEvents?.length || 0} events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {nssiEvents?.slice(0, 20).map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg bg-warning/10 border border-warning/20 hover-elevate transition-all cursor-pointer"
                    data-testid={`nssi-event-${event.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">Severity: {event.severity}/10</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {event.triggerType && (
                      <div className="text-sm text-muted-foreground">Trigger: {event.triggerType}</div>
                    )}
                    {event.interventionUsed && (
                      <div className="text-sm text-muted-foreground">Intervention: {event.interventionUsed}</div>
                    )}
                    {event.note && (
                      <p className="text-sm mt-2 text-foreground/80">{event.note}</p>
                    )}
                  </div>
                ))}
                {(!nssiEvents || nssiEvents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No NSSI events recorded</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
