"use client";

import { useCallback } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { DropZone } from "@/components/upload/drop-zone";
import { FileList } from "@/components/upload/file-list";
import { UploadProgress } from "@/components/upload/upload-progress";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUploadStore } from "@/stores/upload-store";
import { useCompanyStore } from "@/stores/company-store";
import { useTreeStore } from "@/stores/tree-store";
import { runPipeline } from "@/lib/api";
import { ArrowRight, RotateCcw, Upload, MessageSquare } from "lucide-react";

export default function UploadPage() {
  const {
    files,
    processingStatus,
    setProcessingStatus,
    setProgress,
    reset,
  } = useUploadStore();

  const { profile, setPipelineResult } = useCompanyStore();
  const syncFromPipeline = useTreeStore((state) => state.syncFromPipeline);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setProcessingStatus("uploading");
    setProgress(20);

    try {
      const documents = files
        .filter((f) => f.content)
        .map((f) => ({
          source: f.name,
          title: f.name.replace(/\.[^.]+$/, ""),
          content: f.content!,
        }));

      if (documents.length === 0) {
        setProcessingStatus("error");
        return;
      }

      setProgress(40);
      setProcessingStatus("processing");

      const result = await runPipeline(
        {
          name: profile.name,
          industry: profile.industry,
          description: profile.description,
          employeeCount: parseInt(profile.size, 10) || undefined,
        },
        documents
      );

      setProgress(100);
      setPipelineResult(result);
      
      // Sync the tree visualization with backend data
      syncFromPipeline(result);
      
      setProcessingStatus("complete");
    } catch (err) {
      console.error("Pipeline error:", err);
      setProcessingStatus("error");
    }
  }, [files, profile, setProcessingStatus, setProgress, setPipelineResult, syncFromPipeline]);

  return (
    <PageShell className="max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Build Your Tree
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload documents or chat with AI to describe your team structure.
          </p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1 gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with AI
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              Upload Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <div className="h-[520px]">
              <ChatPanel />
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  View Tree
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="space-y-6">
              {processingStatus === "idle" && (
                <>
                  <DropZone />
                  <FileList />
                  {files.length > 0 && (
                    <Button onClick={handleUpload} className="w-full gap-2">
                      Analyze Documents
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}

              <UploadProgress />

              {processingStatus === "error" && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  Analysis failed. Make sure the backend server is running and your documents contain readable text.
                  <div className="mt-3">
                    <Button variant="outline" onClick={reset} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {processingStatus === "complete" && (
                <div className="flex gap-3">
                  <Link href="/analysis" className="flex-1">
                    <Button className="w-full gap-2">
                      View Analysis
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="gap-2">
                      View Tree
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
