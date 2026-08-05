"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersThree } from "@phosphor-icons/react";
import { SidebarAccordion } from "@/features/app/components/sidebar-accordion";
import { cn } from "@/lib/utils";

/** Sidebar entry only — team picking lives on the Teams page to avoid duplicate lists. */
export function TeamsNav({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const teamsHref = `/app/${orgSlug}/teams`;
  const onTeamsRoute = pathname.startsWith(teamsHref);

  return (
    <SidebarAccordion title="Teams" defaultOpen={onTeamsRoute}>
      <ul className="space-y-0.5">
        <li>
          <Link
            href={teamsHref}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              onTeamsRoute
                ? "bg-brand-soft font-medium text-ink"
                : "text-ink-muted hover:bg-canvas hover:text-ink",
            )}
          >
            <UsersThree weight="bold" className="size-4 shrink-0 text-brand" />
            <span>Manage teams</span>
          </Link>
        </li>
      </ul>
    </SidebarAccordion>
  );
}
