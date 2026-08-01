import type { Metadata } from "next";
import { CreateOrgForm } from "@/features/organizations/components/create-org-form";

export const metadata: Metadata = {
  title: "Create organization",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-md animate-auth-rise">
      <div className="flex gap-1.5">
        <span className="size-2 rounded-full bg-lane-work" />
        <span className="size-2 rounded-full bg-lane-docs" />
        <span className="size-2 rounded-full bg-lane-chat" />
      </div>
      <p className="mt-4 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase">
        Step 1 of 1
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-[-0.04em] text-ink">
        Create your organization
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        This is your team&apos;s home in Craftr. We&apos;ll add a default
        workspace called General automatically.
      </p>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <CreateOrgForm />
      </div>
    </div>
  );
}
