"use client";

import { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { CreateTeamForm } from "@/features/teams/components/create-team-form";

export function CreateTeamModal({
  open,
  workspaceId,
  workspaceName,
  onClose,
  onCreated,
}: {
  open: boolean;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onCreated?: (team: { slug: string; id: string }) => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center animate-auth-fade"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-team-title"
        className="relative w-full max-w-lg origin-bottom rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_48px_-20px_rgba(12,17,24,0.28)] animate-auth-rise sm:origin-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              New team
            </p>
            <h2
              id="create-team-title"
              className="mt-1 font-display text-2xl tracking-[-0.04em] text-ink"
            >
              Create team
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              You&apos;ll become the team owner. Created under{" "}
              <span className="font-medium text-ink">{workspaceName}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-canvas hover:text-ink active:scale-[0.98]"
            aria-label="Close"
          >
            <X weight="bold" className="size-4" />
          </button>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <CreateTeamForm
            workspaceId={workspaceId}
            variant="modal"
            onCreated={(team) => {
              onCreated?.(team);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
