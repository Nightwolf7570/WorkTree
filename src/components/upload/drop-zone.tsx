"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadStore, type UploadedFile } from "@/stores/upload-store";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

export function DropZone() {
  const { addFiles } = useUploadStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const uploadedFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      addFiles(uploadedFiles);
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
            PDF, DOCX, PPTX, CSV, or XLSX
          </p>
        </div>
      </div>
    </div>
  );
}
