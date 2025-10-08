import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Database, Eye, Palette, AlertTriangle, Download } from "lucide-react";
import { UserSettings, InsertUserSettings } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<InsertUserSettings>) => {
      return await apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
  });

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/data/all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Data deleted",
        description: "All your emotional data has been permanently removed.",
      });
    },
  });

  const handleToggle = (field: keyof InsertUserSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  const handleSelectChange = (field: keyof InsertUserSettings, value: string | number) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your preferences, privacy, and data controls
        </p>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>Control how your data is processed and stored</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="privacy-mode">Privacy Mode</Label>
              <p className="text-sm text-muted-foreground">
                Hide sensitive information in screenshots and screen sharing
              </p>
            </div>
            <Switch
              id="privacy-mode"
              checked={settings?.privacyMode || false}
              onCheckedChange={(checked) => handleToggle("privacyMode", checked)}
              data-testid="switch-privacy-mode"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="haptic-feedback">Haptic Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Enable visual haptic-like feedback during waveform recording
              </p>
            </div>
            <Switch
              id="haptic-feedback"
              checked={settings?.enableHapticFeedback !== false}
              onCheckedChange={(checked) => handleToggle("enableHapticFeedback", checked)}
              data-testid="switch-haptic-feedback"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Analytics Processing</Label>
              <p className="text-sm text-muted-foreground">
                Enable pattern detection and insights generation
              </p>
            </div>
            <Switch
              id="analytics"
              checked={settings?.enableAnalytics !== false}
              onCheckedChange={(checked) => handleToggle("enableAnalytics", checked)}
              data-testid="switch-analytics"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Control data retention and export preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="retention">Data Retention Period</Label>
            <Select
              value={settings?.dataRetentionDays?.toString() || "90"}
              onValueChange={(value) => handleSelectChange("dataRetentionDays", parseInt(value))}
            >
              <SelectTrigger id="retention" data-testid="select-retention">
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="-1">Forever</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Automatically delete data older than the selected period
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="export-format">Default Export Format</Label>
            <Select
              value={settings?.exportFormat || "json"}
              onValueChange={(value) => handleSelectChange("exportFormat", value)}
            >
              <SelectTrigger id="export-format" data-testid="select-export-format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON (Human-readable)</SelectItem>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="encrypted">Encrypted Backup</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred format for data exports
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the visual theme</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="theme">Theme</Label>
          <Select value={theme} onValueChange={(value: "light" | "dark") => setTheme(value)}>
            <SelectTrigger id="theme" data-testid="select-theme">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose between light and dark color schemes
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible data operations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <h3 className="font-semibold mb-2">Delete All Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete all emotional states, NSSI events, and vault entries. This action cannot be undone.
            </p>
            {!confirmDelete ? (
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                data-testid="button-delete-data-initial"
              >
                Delete All Data
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Are you absolutely sure? This action is permanent.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteAllDataMutation.mutate();
                      setConfirmDelete(false);
                    }}
                    disabled={deleteAllDataMutation.isPending}
                    data-testid="button-delete-data-confirm"
                  >
                    {deleteAllDataMutation.isPending ? "Deleting..." : "Yes, Delete Everything"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                    data-testid="button-delete-data-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Emotional Infrastructure OS</strong> — Privacy-first emotional health tracking
          </p>
          <p>Version 1.0.0</p>
          <p>Built with ethical compliance and data sovereignty principles</p>
        </CardContent>
      </Card>
    </div>
  );
}
