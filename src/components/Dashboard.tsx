"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCw, ShieldCheck } from "lucide-react";

import { IdeaCard } from "@/components/IdeaCard";
import { IdeaDrawer } from "@/components/IdeaDrawer";
import { STATUS_LABELS } from "@/components/statusMeta";
import { Toast, type ToastState } from "@/components/Toast";
import { IDEA_STATUSES, type Idea, type IdeaStatus } from "@/lib/types";

interface DashboardProps {
  initialToken?: string;
}

type StatusFilter = IdeaStatus | "all";

function authHeaders(token: string) {
  return {
    "x-review-token": token,
    "x-actor-name": "HUMAN_REVIEWER"
  };
}

function formatItem(item: unknown) {
  if (typeof item === "string") {
    return item;
  }

  return JSON.stringify(item, null, 2);
}

function ideaToBrief(idea: Idea) {
  return [
    `Title: ${idea.title}`,
    `Owner: ${idea.owner}`,
    `Status: ${STATUS_LABELS[idea.status]}`,
    "",
    "Concept:",
    idea.concept,
    "",
    "Storyboard:",
    ...idea.storyboardBeats.map((beat, index) => `${index + 1}. ${formatItem(beat)}`),
    "",
    "Psychology:",
    idea.psychology || "None captured.",
    "",
    "Why it could perform:",
    idea.whyItCouldPerform || "None captured.",
    "",
    "Caption:",
    idea.caption || "No caption captured.",
    "",
    "On-screen text:",
    ...(idea.onScreenText.length ? idea.onScreenText.map((text) => `- ${formatItem(text)}`) : ["None captured."]),
    "",
    "Risks:",
    ...(idea.risks.length ? idea.risks.map((risk) => `- ${formatItem(risk)}`) : ["None captured."]),
    "",
    "Sources:",
    ...(idea.sources.length ? idea.sources.map((source) => `- ${formatItem(source)}`) : ["None captured."])
  ].join("\n");
}

function storyboardText(idea: Idea) {
  return [
    idea.title,
    "",
    ...idea.storyboardBeats.map((beat, index) => `Beat ${index + 1}: ${formatItem(beat)}`),
    "",
    "On-screen text:",
    ...(idea.onScreenText.length ? idea.onScreenText.map((text) => `- ${formatItem(text)}`) : ["None captured."])
  ].join("\n");
}

function groupIdeas(ideas: Idea[]) {
  return IDEA_STATUSES.reduce<Record<IdeaStatus, Idea[]>>(
    (groups, status) => {
      groups[status] = ideas.filter((idea) => idea.status === status);
      return groups;
    },
    {
      pending_review: [],
      reviewed: [],
      approved: [],
      flagged: [],
      discarded: []
    }
  );
}

async function fetchIdeasByStatus(status: IdeaStatus, activeToken: string) {
  const response = await fetch(`/api/ideas?status=${status}&limit=100`, {
    headers: authHeaders(activeToken)
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Could not load ${STATUS_LABELS[status].toLowerCase()} ideas.`);
  }

  return payload.items as Idea[];
}

export function Dashboard({ initialToken = "" }: DashboardProps) {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [token, setToken] = useState(initialToken);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Idea | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const grouped = useMemo(() => groupIdeas(ideas), [ideas]);
  const approvedCount = grouped.approved.length;
  const pendingCount = grouped.pending_review.length;
  const reviewedCount = grouped.reviewed.length;
  const visibleStatuses = activeStatus === "all" ? IDEA_STATUSES : [activeStatus];

  const showToast = useCallback((next: ToastState) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const refreshIdeas = useCallback(
    async (activeToken: string) => {
      if (!activeToken) {
        return;
      }

      setLoading(true);

      try {
        const results = await Promise.allSettled(
          IDEA_STATUSES.map((status) => fetchIdeasByStatus(status, activeToken))
        );
        const uniqueIdeas = new Map<string, Idea>();
        const loadedStatuses = new Set<IdeaStatus>();
        const failedStatuses: string[] = [];

        results.forEach((result, index) => {
          const status = IDEA_STATUSES[index];

          if (result.status === "fulfilled") {
            loadedStatuses.add(status);

            for (const idea of result.value) {
              uniqueIdeas.set(idea.id, idea);
            }
          } else {
            failedStatuses.push(STATUS_LABELS[status]);
          }
        });

        setIdeas((currentIdeas) => {
          for (const idea of currentIdeas) {
            if (!loadedStatuses.has(idea.status)) {
              uniqueIdeas.set(idea.id, idea);
            }
          }

          return Array.from(uniqueIdeas.values()).sort((a, b) => {
            if (a.createdAt === b.createdAt) {
              return b.id.localeCompare(a.id);
            }

            return b.createdAt.localeCompare(a.createdAt);
          });
        });

        if (failedStatuses.length) {
          showToast({
            type: "error",
            message: `Some lists could not load: ${failedStatuses.join(", ")}.`
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          message: error instanceof Error ? error.message : "Could not load ideas."
        });
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const openIdea = useCallback(
    async (idea: Idea, activeToken: string) => {
      setSelected(idea);
      setSelectedLoading(true);

      try {
        const response = await fetch(`/api/ideas/${idea.id}`, {
          headers: authHeaders(activeToken)
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Could not open idea.");
        }

        setSelected(payload.idea);
      } catch (error) {
        showToast({
          type: "error",
          message: error instanceof Error ? error.message : "Could not open idea."
        });
      } finally {
        setSelectedLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (initialToken) {
      window.localStorage.setItem("120-bank-review-token", initialToken);
    }
  }, [initialToken]);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem("120-bank-review-token", token);
      const timer = window.setTimeout(() => {
        void refreshIdeas(token);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [refreshIdeas, token]);

  function submitToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = tokenInput.trim();

    if (!trimmed) {
      showToast({ type: "error", message: "Review token is required." });
      return;
    }

    setToken(trimmed);
  }

  async function runAction(action: "approve" | "flag" | "discard") {
    if (!selected) {
      return;
    }

    if (action === "discard" && !window.confirm("Discard this idea?")) {
      return;
    }

    setBusyAction(action);

    try {
      const response = await fetch(`/api/ideas/${selected.id}/${action}`, {
        method: "PATCH",
        headers: {
          ...authHeaders(token),
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Action failed.");
      }

      setSelected(payload.idea);
      await refreshIdeas(token);
      await openIdea(payload.idea, token);
      showToast({
        type: "success",
        message:
          action === "approve"
            ? "Idea approved."
            : action === "flag"
              ? "Idea flagged."
              : "Idea discarded."
      });
    } catch (error) {
      showToast({
        type: "error",
        message: error instanceof Error ? error.message : "Action failed."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function copy(kind: "brief" | "storyboard" | "caption") {
    if (!selected) {
      return;
    }

    const text =
      kind === "brief"
        ? ideaToBrief(selected)
        : kind === "storyboard"
          ? storyboardText(selected)
          : selected.caption || "";

    await navigator.clipboard.writeText(text);
    showToast({
      type: "success",
      message:
        kind === "brief" ? "Brief copied." : kind === "storyboard" ? "Storyboard copied." : "Caption copied."
    });
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form onSubmit={submitToken} className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950/90 p-6 shadow-panel">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg border border-teal-400/40 bg-teal-400/10 p-3 text-teal-200">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-50">120 Bank</h1>
              <p className="text-sm text-zinc-400">Human review token required.</p>
            </div>
          </div>
          <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="review-token">
            Review token
          </label>
          <input
            id="review-token"
            type="password"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            autoComplete="off"
          />
          <button
            type="submit"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Open review queue
          </button>
        </form>
        <Toast toast={toast} />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-4 flex flex-col gap-3 border-b border-zinc-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-50">120 Bank</h1>
            <span className="rounded-full border border-teal-400/40 bg-teal-400/10 px-2 py-0.5 text-xs font-semibold text-teal-200">
              Human Review
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {pendingCount} pending, {reviewedCount} ready, {approvedCount} approved
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshIdeas(token)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </header>

      <section
        aria-label="Status filter"
        className="mb-4 flex gap-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2"
      >
        {[
          { value: "all" as const, label: "All", count: ideas.length },
          ...IDEA_STATUSES.map((status) => ({
            value: status,
            label: STATUS_LABELS[status],
            count: grouped[status].length
          }))
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveStatus(filter.value)}
            aria-pressed={activeStatus === filter.value}
            className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
              activeStatus === filter.value
                ? "border-teal-300 bg-teal-400 text-zinc-950"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
            }`}
          >
            <span>{filter.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeStatus === filter.value ? "bg-zinc-950/15 text-zinc-950" : "bg-zinc-950 text-zinc-400"
              }`}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </section>

      <section className={`grid gap-3 ${activeStatus === "all" ? "xl:grid-cols-5" : "lg:grid-cols-2 xl:grid-cols-3"}`}>
        {visibleStatuses.map((status) => (
          <div key={status} className="rounded-lg border border-zinc-800 bg-zinc-950/60">
            <div className="flex items-center justify-between rounded-t-lg border-b border-zinc-800 bg-zinc-950 px-3 py-3">
              <h2 className="text-sm font-semibold text-zinc-100">{STATUS_LABELS[status]}</h2>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-zinc-400">
                {grouped[status].length}
              </span>
            </div>
            <div
              className="max-h-[47.75rem] space-y-3 overflow-y-auto p-3 pr-2"
              data-testid={`pipeline-list-${status}`}
            >
              {grouped[status].length ? (
                grouped[status].map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    selected={selected?.id === idea.id}
                    onSelect={() => openIdea(idea, token)}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-4 text-center text-sm text-zinc-500">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <IdeaDrawer
        idea={selected}
        loading={selectedLoading}
        onClose={() => setSelected(null)}
        onApprove={() => runAction("approve")}
        onFlag={() => runAction("flag")}
        onDiscard={() => runAction("discard")}
        onCopy={copy}
        busyAction={busyAction}
      />
      <Toast toast={toast} />
    </main>
  );
}
