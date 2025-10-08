import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { EmotionalState, NssiEvent } from "@shared/schema";

export default function Dashboard() {
  const { data: recentStates, isLoading: statesLoading } = useQuery<EmotionalState[]>({
    queryKey: ["/api/emotional-states/recent"],
  });

  const { data: todayStats } = useQuery<{
    avgIntensity: number;
    peakIntensity: number;
    stateCount: number;
    nssiCount: number;
  }>({
    queryKey: ["/api/stats/today"],
  });

  const { data: recentEvents } = useQuery<NssiEvent[]>({
    queryKey: ["/api/nssi-events/recent"],
  });

  const currentState = recentStates?.[0];

  return (
    <div className="min-h-screen">
      {/* Hero Waveform */}
      <div className="relative h-[50vh] bg-gradient-to-br from-primary/20 via-background to-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {statesLoading ? (
            <div className="text-muted-foreground">Loading current state...</div>
          ) : currentState ? (
            <div className="text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/50">
                <Activity className="w-12 h-12 text-primary" data-testid="icon-current-state" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground font-mono">Current Intensity</div>
                <div className="text-6xl font-display font-bold" data-testid="text-current-intensity">
                  {currentState.intensity.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Valence: {currentState.valence.toFixed(1)} · Arousal: {currentState.arousal.toFixed(1)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 p-6">
              <div className="text-muted-foreground">No emotional state recorded yet</div>
              <Link href="/waveform">
                <Button data-testid="button-record-first-state">Record Your First State</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Intensity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-intensity">
                {todayStats?.avgIntensity?.toFixed(1) ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Today's average</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">States Recorded</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-state-count">
                {todayStats?.stateCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Today's entries</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NSSI Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-nssi-count">
                {todayStats?.nssiCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tracked today</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/waveform">
            <Card className="hover-elevate cursor-pointer transition-all duration-300" data-testid="card-record-state">
              <CardHeader>
                <CardTitle>Record Emotional State</CardTitle>
                <CardDescription>Track your current emotional state with waveform visualization</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover-elevate cursor-pointer transition-all duration-300" data-testid="card-view-analytics">
              <CardHeader>
                <CardTitle>View Analytics</CardTitle>
                <CardDescription>Explore patterns and insights from your emotional data</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Events */}
        {recentEvents && recentEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent NSSI Events</CardTitle>
              <CardDescription>Your most recent tracked events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
                    data-testid={`event-${event.id}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        Severity: {event.severity}/10
                        {event.triggerType && (
                          <span className="text-muted-foreground ml-2">· {event.triggerType}</span>
                        )}
                      </div>
                      {event.note && <p className="text-sm text-muted-foreground mt-1">{event.note}</p>}
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
