"use client";

import {
  CheckCircle2,
  Clipboard,
  Flag,
  ListChecks,
  Loader2,
  MessageSquareText,
  Trash2,
  X
} from "lucide-react";

import { STATUS_LABELS, STATUS_STYLES } from "@/components/statusMeta";
import type { Idea, IdeaEvent } from "@/lib/types";

interface IdeaDrawerProps {
  idea: Idea | null;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onFlag: () => void;
  onDiscard: () => void;
  onCopy: (kind: "brief" | "storyboard" | "caption") => void;
  busyAction: string | null;
}

function formatItem(item: unknown) {
  if (typeof item === "string") {
    return item;
  }

  return JSON.stringify(item, null, 2);
}

function EventRow({ event }: { event: IdeaEvent }) {
  return (
    <li className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{event.action}</span>
        <time className="text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString()}</time>
      </div>
      <p className="mt-1 text-sm text-zinc-800">
        {event.actorName} {event.fromStatus ? `${STATUS_LABELS[event.fromStatus]} -> ` : ""}
        {event.toStatus ? STATUS_LABELS[event.toStatus] : ""}
      </p>
      {event.note ? <p className="mt-1 text-xs leading-5 text-zinc-600">{event.note}</p> : null}
    </li>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200 py-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

export function IdeaDrawer({
  idea,
  loading,
  onClose,
  onApprove,
  onFlag,
  onDiscard,
  onCopy,
  busyAction
}: IdeaDrawerProps) {
  return (
    <aside
      className={`fixed inset-y-0 right-0 z-30 flex w-full max-w-2xl flex-col border-l border-zinc-200 bg-[#fbfbf8] shadow-panel transition-transform duration-200 ${
        idea || loading ? "translate-x-0" : "translate-x-full"
      }`}
      aria-label="Idea detail"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Idea Brief</p>
          <h2 className="truncate text-lg font-semibold text-zinc-950">{idea?.title ?? "Loading idea"}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50"
          aria-label="Close idea detail"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Loading
        </div>
      ) : idea ? (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-5 py-3">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[idea.status]}`}>
              {STATUS_LABELS[idea.status]}
            </span>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
              {idea.owner}
            </span>
            <span className="text-xs text-zinc-500">Created {new Date(idea.createdAt).toLocaleString()}</span>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-zinc-200 bg-white px-5 py-3">
            <button
              type="button"
              onClick={() => onCopy("brief")}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              <Clipboard className="h-4 w-4" aria-hidden="true" />
              Copy brief
            </button>
            <button
              type="button"
              onClick={() => onCopy("storyboard")}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Copy storyboard
            </button>
            <button
              type="button"
              onClick={() => onCopy("caption")}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              Copy caption
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            <Section title="Concept">
              <p className="text-sm leading-6 text-zinc-800">{idea.concept}</p>
            </Section>

            <Section title="Storyboard Beats">
              <ol className="space-y-2">
                {idea.storyboardBeats.map((beat, index) => (
                  <li key={`${index}-${formatItem(beat).slice(0, 20)}`} className="rounded-md border border-zinc-200 bg-white p-3">
                    <span className="text-xs font-semibold text-zinc-500">Beat {index + 1}</span>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{formatItem(beat)}</p>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Psychology">
              <p className="text-sm leading-6 text-zinc-800">{idea.psychology || "None captured."}</p>
            </Section>

            <Section title="Performance Rationale">
              <p className="text-sm leading-6 text-zinc-800">{idea.whyItCouldPerform || "None captured."}</p>
            </Section>

            <Section title="Caption and On-screen Text">
              <div className="space-y-3">
                <p className="rounded-md border border-zinc-200 bg-white p-3 text-sm leading-6 text-zinc-800">
                  {idea.caption || "No caption captured."}
                </p>
                {idea.onScreenText.length ? (
                  <ul className="space-y-2">
                    {idea.onScreenText.map((text, index) => (
                      <li key={`${index}-${formatItem(text).slice(0, 20)}`} className="rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-800">
                        {formatItem(text)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Section>

            <Section title="Risks">
              {idea.risks.length ? (
                <ul className="space-y-2">
                  {idea.risks.map((risk, index) => (
                    <li key={`${index}-${formatItem(risk).slice(0, 20)}`} className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">
                      {formatItem(risk)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-600">No risks captured.</p>
              )}
            </Section>

            <Section title="Sources">
              {idea.sources.length ? (
                <ul className="space-y-2">
                  {idea.sources.map((source, index) => (
                    <li key={`${index}-${formatItem(source).slice(0, 20)}`} className="rounded-md border border-zinc-200 bg-white p-3 text-sm leading-6 text-zinc-800">
                      {formatItem(source)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-600">No sources captured.</p>
              )}
            </Section>

            <Section title="Audit Trail">
              {idea.events?.length ? (
                <ul className="space-y-2 pb-5">
                  {idea.events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </ul>
              ) : (
                <p className="pb-5 text-sm text-zinc-600">No audit events captured.</p>
              )}
            </Section>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-white px-5 py-4">
            {idea.status === "reviewed" ? (
              <button
                type="button"
                onClick={onApprove}
                disabled={Boolean(busyAction)}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                )}
                Approve
              </button>
            ) : null}
            {!["flagged", "discarded"].includes(idea.status) ? (
              <button
                type="button"
                onClick={onFlag}
                disabled={Boolean(busyAction)}
                className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "flag" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Flag className="h-4 w-4" aria-hidden="true" />
                )}
                Flag
              </button>
            ) : null}
            {idea.status !== "discarded" ? (
              <button
                type="button"
                onClick={onDiscard}
                disabled={Boolean(busyAction)}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "discard" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                Discard
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </aside>
  );
}
