import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, Square, Download } from "lucide-react";
import { InsertEmotionalState } from "@shared/schema";

export default function Waveform() {
  const [isRecording, setIsRecording] = useState(false);
  const [intensity, setIntensity] = useState([50]);
  const [valence, setValence] = useState([0]);
  const [arousal, setArousal] = useState([50]);
  const [note, setNote] = useState("");
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStateMutation = useMutation({
    mutationFn: async (data: InsertEmotionalState) => {
      return await apiRequest("POST", "/api/emotional-states", data);
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/emotional-states/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nssi-events/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/patterns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vault/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vault/status"] });
      // Also invalidate base queries for history page
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith("/api/emotional-states") || key?.startsWith("/api/nssi-events");
        }
      });
      toast({
        title: "Emotional state recorded",
        description: "Your emotional state has been securely saved to the vault.",
      });
      setNote("");
      setWaveformData([]);
    },
  });

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, 0);
      bgGradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
      bgGradient.addColorStop(1, "rgba(168, 85, 247, 0.1)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      if (waveformData.length > 0) {
        // Waveform gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "rgb(59, 130, 246)");
        gradient.addColorStop(1, "rgb(168, 85, 247)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        const step = width / (waveformData.length - 1 || 1);

        waveformData.forEach((value, i) => {
          const x = i * step;
          const y = height / 2 - (value * height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Fill area under curve
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
        ctx.fill();
      } else {
        // Placeholder line
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    draw();
  }, [waveformData]);

  const startRecording = () => {
    setIsRecording(true);
    setWaveformData([]);

    let time = 0;
    const recordData = () => {
      // Simulate waveform based on current slider values
      const baseValue = intensity[0] / 100;
      const valenceEffect = valence[0] / 200; // -0.5 to 0.5
      const arousalEffect = (arousal[0] / 100) * 0.3;
      
      const noise = (Math.sin(time * 0.1) * 0.1 + Math.random() * 0.1 - 0.05);
      const value = Math.max(-1, Math.min(1, baseValue + valenceEffect + arousalEffect + noise));

      setWaveformData((prev) => [...prev.slice(-100), value]);
      time++;

      if (isRecording) {
        animationRef.current = requestAnimationFrame(recordData);
      }
    };

    animationRef.current = requestAnimationFrame(recordData);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleSave = () => {
    createStateMutation.mutate({
      intensity: intensity[0],
      valence: valence[0],
      arousal: arousal[0],
      note: note || null,
      waveformData: waveformData.length > 0 ? waveformData : null,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Waveform Visualization</h1>
        <p className="text-muted-foreground mt-2">
          Track your emotional state with real-time waveform feedback
        </p>
      </div>

      {/* Waveform Canvas */}
      <Card className={`shadow-lg transition-all duration-300 ${isRecording ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={1200}
            height={400}
            className="w-full h-[400px] rounded-lg"
            data-testid="canvas-waveform"
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Emotional Parameters</CardTitle>
            <CardDescription>Adjust sliders to reflect your current state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Intensity</Label>
                <span className="text-sm font-mono text-muted-foreground" data-testid="text-intensity-value">
                  {intensity[0]}
                </span>
              </div>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={100}
                step={1}
                data-testid="slider-intensity"
              />
              <p className="text-xs text-muted-foreground">How strong is this emotion?</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Valence</Label>
                <span className="text-sm font-mono text-muted-foreground" data-testid="text-valence-value">
                  {valence[0] > 0 ? '+' : ''}{valence[0]}
                </span>
              </div>
              <Slider
                value={valence}
                onValueChange={setValence}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-valence"
              />
              <p className="text-xs text-muted-foreground">Negative (-) to Positive (+)</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Arousal</Label>
                <span className="text-sm font-mono text-muted-foreground" data-testid="text-arousal-value">
                  {arousal[0]}
                </span>
              </div>
              <Slider
                value={arousal}
                onValueChange={setArousal}
                max={100}
                step={1}
                data-testid="slider-arousal"
              />
              <p className="text-xs text-muted-foreground">Calm (0) to Alert (100)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Controls</CardTitle>
            <CardDescription>Record and save your emotional state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="flex-1"
                  size="lg"
                  data-testid="button-start-recording"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                  data-testid="button-stop-recording"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              )}

              <Button variant="outline" size="lg" disabled={waveformData.length === 0} data-testid="button-export">
                <Download className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add any notes about this emotional state..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                data-testid="input-note"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={createStateMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-save-state"
            >
              {createStateMutation.isPending ? "Saving..." : "Save to Vault"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
