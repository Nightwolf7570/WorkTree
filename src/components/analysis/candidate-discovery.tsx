"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InsightCard } from "./insight-card";
import { 
  Users, 
  ExternalLink, 
  Github, 
  Linkedin, 
  RefreshCw,
  Loader2,
  UserPlus
} from "lucide-react";
import type { BackendCandidate } from "@/types/analysis";
import { discoverCandidates } from "@/lib/api";

interface CandidateDiscoveryProps {
  candidates: BackendCandidate[];
  recommendationId: string | null;
  onCandidatesUpdated?: (candidates: BackendCandidate[]) => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500/15 text-green-400 border-green-500/20";
  if (score >= 60) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
  return "bg-orange-500/15 text-orange-400 border-orange-500/20";
}

export function CandidateDiscovery({ 
  candidates, 
  recommendationId,
  onCandidatesUpdated 
}: CandidateDiscoveryProps) {
  const [discovering, setDiscovering] = useState(false);
  const [localCandidates, setLocalCandidates] = useState<BackendCandidate[]>(candidates);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = useCallback(async () => {
    if (!recommendationId) return;
    
    setDiscovering(true);
    setError(null);
    
    try {
      const newCandidates = await discoverCandidates(recommendationId);
      setLocalCandidates(newCandidates);
      onCandidatesUpdated?.(newCandidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discover candidates");
    } finally {
      setDiscovering(false);
    }
  }, [recommendationId, onCandidatesUpdated]);

  const displayCandidates = localCandidates.length > 0 ? localCandidates : candidates;

  return (
    <InsightCard
      title="Candidate Discovery"
      icon={<Users className="h-5 w-5 text-[hsl(42,55%,52%)]" />}
    >
      <div className="space-y-4">
        {/* Header with discover button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {displayCandidates.length > 0 
              ? `${displayCandidates.length} candidates found`
              : "No candidates discovered yet"
            }
          </p>
          {recommendationId && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDiscover}
              disabled={discovering}
              className="gap-2"
            >
              {discovering ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : displayCandidates.length > 0 ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              {discovering 
                ? "Searching..." 
                : displayCandidates.length > 0 
                  ? "Find More" 
                  : "Discover"
              }
            </Button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
            {error}
          </p>
        )}

        {/* Candidate list */}
        {displayCandidates.length > 0 ? (
          <div className="space-y-3">
            {displayCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {candidate.name}
                    </h4>
                    {candidate.title && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {candidate.title}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${getScoreColor(candidate.score)}`}
                  >
                    {candidate.score}% match
                  </Badge>
                </div>
                
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {candidate.reasoning}
                </p>
                
                {/* Social links */}
                <div className="mt-3 flex items-center gap-2">
                  {candidate.linkedinUrl && (
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {candidate.githubUrl && (
                    <a
                      href={candidate.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" />
                      GitHub
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !discovering && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Click "Discover" to find matching candidates
            </p>
            <p className="text-xs mt-1 opacity-75">
              AI will search for candidates based on your hiring recommendations
            </p>
          </div>
        )}
      </div>
    </InsightCard>
  );
}
