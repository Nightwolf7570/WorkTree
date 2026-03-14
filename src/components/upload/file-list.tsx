"use client";

import { useUploadStore } from "@/stores/upload-store";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList() {
  const { files, removeFile } = useUploadStore();

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        {files.length} file{files.length !== 1 ? "s" : ""} selected
      </p>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => removeFile(file.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
