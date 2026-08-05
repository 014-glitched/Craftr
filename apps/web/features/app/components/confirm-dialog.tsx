"use client";

import { CircleNotch } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="presentation"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="w-full max-w-md rounded-[10px] border border-line bg-surface p-6 shadow-[var(--shadow-soft)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h4
          id="confirm-dialog-title"
          className="font-display text-lg tracking-[-0.03em] text-ink"
        >
          {title}
        </h4>
        <div id="confirm-dialog-desc" className="mt-2 text-sm text-ink-muted">
          {description}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-[10px] border border-line px-3 py-2 text-sm text-ink-muted transition-[transform,colors] hover:bg-canvas hover:text-ink enabled:active:scale-[0.98] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "inline-flex items-center gap-2 rounded-[10px] bg-danger px-3 py-2 text-sm font-semibold text-white transition-[transform,opacity] enabled:active:scale-[0.98] disabled:opacity-60"
                : "inline-flex items-center gap-2 rounded-[10px] bg-accent px-3 py-2 text-sm font-semibold text-accent-fg transition-[transform,opacity] enabled:active:scale-[0.98] disabled:opacity-60"
            }
          >
            {loading ? (
              <CircleNotch weight="bold" className="size-4 animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
