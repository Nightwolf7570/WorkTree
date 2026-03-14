"use client";

import { useCallback, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCompanyStore } from "@/stores/company-store";
import { saveCompanyProfile } from "@/lib/api";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { profile, setProfile, companyId } = useCompanyStore();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");
    
    try {
      await saveCompanyProfile(profile, companyId);
      setSaveStatus("success");
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [profile, companyId]);

  return (
    <PageShell className="max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your company profile.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={profile.industry}
                onChange={(e) => setProfile({ industry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Input
                id="size"
                type="number"
                value={profile.size}
                onChange={(e) => setProfile({ size: e.target.value })}
                placeholder="Number of employees"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={profile.description}
                onChange={(e) => setProfile({ description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
              
              {saveStatus === "success" && (
                <span className="flex items-center gap-1.5 text-sm text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  Saved successfully
                </span>
              )}
              
              {saveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage || "Failed to save"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
