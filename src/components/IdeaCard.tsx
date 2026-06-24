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
      className: "text-rose-700 bg-rose-50 border-rose-200"
    };
  }

  if (risks.length > 0) {
    return {
      label: "Watch",
      className: "text-amber-700 bg-amber-50 border-amber-200"
    };
  }

  return {
    label: "Low risk",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200"
  };
}

export function IdeaCard({ idea, selected, onSelect }: IdeaCardProps) {
  const risk = riskLabel(idea.risks);

  return (
    <button
      type="button"
      onClick={() => onSelect(idea)}
      className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-zinc-400 hover:shadow-panel ${
        selected ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[idea.status]}`}>
          {STATUS_LABELS[idea.status]}
        </span>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
          {idea.owner}
        </span>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-zinc-950">{idea.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-600">{idea.concept}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${risk.className}`}>
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          {risk.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-medium text-zinc-600">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          {ageLabel(idea.createdAt)}
        </span>
      </div>
    </button>
  );
}
