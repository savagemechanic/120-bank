import type { IdeaStatus } from "@/lib/types";

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  approved: "Approved",
  flagged: "Flagged",
  discarded: "Discarded"
};

export const STATUS_STYLES: Record<IdeaStatus, string> = {
  pending_review: "border-amber-200 bg-amber-50 text-amber-800",
  reviewed: "border-cyan-200 bg-cyan-50 text-cyan-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  flagged: "border-rose-200 bg-rose-50 text-rose-800",
  discarded: "border-zinc-200 bg-zinc-100 text-zinc-600"
};
