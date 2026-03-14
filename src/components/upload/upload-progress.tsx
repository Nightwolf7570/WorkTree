"use client";

import { useUploadStore } from "@/stores/upload-store";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2 } from "lucide-react";

const statusMessages: Record<string, string> = {
  uploading: "Uploading documents...",
  processing: "AI is analyzing your documents...",
  complete: "Analysis complete!",
  error: "Something went wrong. Please try again.",
};

export function UploadProgress() {
  const { processingStatus, progress } = useUploadStore();

  if (processingStatus === "idle") return null;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        {processingStatus === "complete" ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
        <p className="text-sm font-medium text-foreground">
          {statusMessages[processingStatus] || "Processing..."}
        </p>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
    </div>
  );
}
