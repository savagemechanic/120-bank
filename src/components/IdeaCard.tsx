"use client";

import { AlertTriangle, Clock3 } from "lucide-react";

import { STATUS_LABELS, STATUS_STYLES } from "@/components/statusMeta";
import type { Idea } from "@/lib/types";

interface IdeaCardProps {
  idea: Idea;
  selected: boolean;
  onSelect: (idea: Idea) => void;
}

function ageLabel(date: string) {
  const created = new Date(date).getTime();
  const diff = Math.max(0, Date.now() - created);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${Math.max(1, minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 48) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d`;
}

function riskLabel(risks: unknown[]) {
  if (risks.length >= 3) {
    return {
      label: "High risk",
      className: "text-rose-200 bg-rose-400/10 border-rose-400/35"
    };
  }

  if (risks.length > 0) {
    return {
      label: "Watch",
      className: "text-amber-200 bg-amber-400/10 border-amber-400/35"
    };
  }

  return {
    label: "Low risk",
    className: "text-emerald-200 bg-emerald-400/10 border-emerald-400/35"
  };
}

export function IdeaCard({ idea, selected, onSelect }: IdeaCardProps) {
  const risk = riskLabel(idea.risks);

  return (
    <button
      type="button"
      onClick={() => onSelect(idea)}
      className={`h-44 w-full rounded-lg border bg-zinc-950/80 p-3 text-left shadow-sm transition hover:border-teal-400/60 hover:bg-zinc-900 hover:shadow-panel ${
        selected ? "border-teal-300 ring-2 ring-teal-300/20" : "border-zinc-800"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[idea.status]}`}>
          {STATUS_LABELS[idea.status]}
        </span>
        <span className="rounded-full border border-teal-400/40 bg-teal-400/10 px-2 py-0.5 text-[11px] font-semibold text-teal-200">
          {idea.owner}
        </span>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-zinc-50">{idea.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-400">{idea.concept}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${risk.className}`}>
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          {risk.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-medium text-zinc-400">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          {ageLabel(idea.createdAt)}
        </span>
      </div>
    </button>
  );
}
