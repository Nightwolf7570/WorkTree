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
import { uploadDocuments, getProcessingStatus } from "@/lib/api";
import { ArrowRight, RotateCcw, Upload, MessageSquare } from "lucide-react";

export default function UploadPage() {
  const {
    files,
    processingStatus,
    setJobId,
    setProcessingStatus,
    setProgress,
    reset,
  } = useUploadStore();

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setProcessingStatus("uploading");
    setProgress(10);

    const { jobId } = await uploadDocuments([]);
    setJobId(jobId);
    setProcessingStatus("processing");

    const poll = async () => {
      const result = await getProcessingStatus(jobId);
      setProgress(result.progress);
      if (result.status === "complete") {
        setProcessingStatus("complete");
      } else {
        setTimeout(poll, 1200);
      }
    };
    poll();
  }, [files, setJobId, setProcessingStatus, setProgress]);

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

              {processingStatus === "complete" && (
                <div className="flex gap-3">
                  <Link href="/analysis" className="flex-1">
                    <Button className="w-full gap-2">
                      View Analysis
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
