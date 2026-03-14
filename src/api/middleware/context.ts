/**
 * Workspace context threaded through all pipeline operations.
 * Keeps function signatures clean — modules accept this instead of loose args.
 */
export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
}
