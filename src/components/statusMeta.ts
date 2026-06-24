import type { IdeaStatus } from "@/lib/types";

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  approved: "Approved",
  flagged: "Flagged",
  discarded: "Discarded"
};

export const STATUS_STYLES: Record<IdeaStatus, string> = {
  pending_review: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  reviewed: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  approved: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  flagged: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  discarded: "border-zinc-500/40 bg-zinc-800 text-zinc-300"
};
