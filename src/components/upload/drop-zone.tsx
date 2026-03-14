"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadStore, type UploadedFile } from "@/stores/upload-store";

const ACCEPTED_TYPES = {
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "text/csv": [".csv"],
  "application/json": [".json"],
};

export function DropZone() {
  const { addFiles } = useUploadStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      Promise.all(
        acceptedFiles.map(
          (file) =>
            new Promise<UploadedFile>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  content: (e.target?.result as string) ?? "",
                });
              };
              reader.readAsText(file);
            })
        )
      ).then((uploadedFiles) => addFiles(uploadedFiles));
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3 text-center">
        {isDragActive ? (
          <FileText className="h-10 w-10 text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop files here" : "Drag & drop your documents"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            TXT, MD, CSV, or JSON — plain text files the AI can read
          </p>
        </div>
      </div>
    </div>
  );
}
