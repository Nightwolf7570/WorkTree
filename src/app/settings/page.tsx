"use client";

import { useCallback } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCompanyStore } from "@/stores/company-store";
import { saveCompanyProfile } from "@/lib/api";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { profile, setProfile } = useCompanyStore();

  const handleSave = useCallback(async () => {
    await saveCompanyProfile(profile);
  }, [profile]);

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
                value={profile.size}
                onChange={(e) => setProfile({ size: e.target.value })}
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
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
