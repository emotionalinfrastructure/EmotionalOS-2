import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Lock, CheckCircle, Link as LinkIcon } from "lucide-react";
import { VaultEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Vault() {
  const { toast } = useToast();

  const { data: vaultEntries } = useQuery<VaultEntry[]>({
    queryKey: ["/api/vault/entries"],
  });

  const { data: vaultStatus } = useQuery<{
    totalEntries: number;
    encryptedEntries: number;
    lastHash: string;
    chainIntegrity: boolean;
  }>({
    queryKey: ["/api/vault/status"],
  });

  const handleExport = async (format: "json" | "encrypted") => {
    try {
      const response = await fetch(`/api/vault/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emotional-data-${Date.now()}.${format === "json" ? "json" : "enc"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Your data has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Sovereign Data Vault</h1>
        <p className="text-muted-foreground mt-2">
          Immutable, encrypted proof-of-sovereignty for your emotional data
        </p>
      </div>

      {/* Hero Status Card */}
      <Card className="border-2 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/50">
              <Shield className="w-12 h-12 text-primary" data-testid="icon-vault-shield" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold">Your Data is Secure</h2>
              <p className="text-muted-foreground max-w-md">
                All emotional states and events are cryptographically secured with blockchain-style immutability
              </p>
            </div>

            <div className="flex items-center gap-2">
              {vaultStatus?.chainIntegrity ? (
                <>
                  <CheckCircle className="w-5 h-5 text-chart-2" />
                  <span className="text-sm font-medium text-chart-2">Chain Integrity Verified</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Initializing...</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-entries">
              {vaultStatus?.totalEntries || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Encrypted Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-encrypted-entries">
              {vaultStatus?.encryptedEntries || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Latest Hash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono truncate" data-testid="text-latest-hash">
              {vaultStatus?.lastHash || "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download your complete emotional data in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleExport("json")}
              variant="outline"
              className="h-auto flex-col items-start p-4"
              data-testid="button-export-json"
            >
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5" />
                <span className="font-semibold">Export as JSON</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Human-readable format for analysis and backup
              </p>
            </Button>

            <Button
              onClick={() => handleExport("encrypted")}
              variant="outline"
              className="h-auto flex-col items-start p-4"
              data-testid="button-export-encrypted"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-semibold">Export Encrypted</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Maximum security encrypted backup
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Immutability Chain */}
      <Card>
        <CardHeader>
          <CardTitle>Immutability Chain</CardTitle>
          <CardDescription>
            Blockchain-style timestamp verification for data sovereignty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {vaultEntries && vaultEntries.length > 0 ? (
              vaultEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover-elevate transition-all"
                  data-testid={`vault-entry-${entry.id}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {index === 0 ? (
                      <CheckCircle className="w-5 h-5 text-chart-2" />
                    ) : (
                      <LinkIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="capitalize">
                        {entry.entryType.replace("_", " ")}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Hash:</div>
                      <div className="text-sm font-mono break-all bg-background/50 p-2 rounded">
                        {entry.dataHash}
                      </div>
                    </div>
                    {entry.previousHash && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Previous Hash:</div>
                        <div className="text-sm font-mono break-all bg-background/50 p-2 rounded opacity-60">
                          {entry.previousHash}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={entry.encryptionStatus === "encrypted" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {entry.encryptionStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No vault entries yet. Start tracking to build your sovereignty chain.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
