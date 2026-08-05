export type PhaseStatus = "done" | "current" | "upcoming";

export type RoadmapPhase = {
  id: number;
  name: string;
  blurb: string;
  status: PhaseStatus;
  href?: string;
};

/** Product roadmap mirrored from documents/04-development-roadmap.md */
export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 0,
    name: "Planning",
    blurb: "Architecture, ADRs, docs",
    status: "done",
  },
  {
    id: 1,
    name: "Auth",
    blurb: "Sessions and protected shell",
    status: "done",
  },
  {
    id: 2,
    name: "Orgs",
    blurb: "Tenancy, invites, workspaces",
    status: "done",
    href: "workspaces",
  },
  {
    id: 3,
    name: "Teams",
    blurb: "Members and ownership",
    status: "done",
    href: "teams",
  },
  {
    id: 4,
    name: "Projects",
    blurb: "Tasks, assignees, lists",
    status: "current",
  },
  {
    id: 5,
    name: "Kanban",
    blurb: "Boards and live updates",
    status: "upcoming",
  },
  {
    id: 6,
    name: "Notify",
    blurb: "Feed, Redis, queues",
    status: "upcoming",
  },
  {
    id: 7,
    name: "Docs",
    blurb: "Rich text writing",
    status: "upcoming",
  },
  {
    id: 8,
    name: "Files",
    blurb: "Uploads and attachments",
    status: "upcoming",
  },
  {
    id: 9,
    name: "Chat",
    blurb: "Channels and presence",
    status: "upcoming",
  },
  {
    id: 10,
    name: "Search",
    blurb: "Global index",
    status: "upcoming",
  },
  {
    id: 11,
    name: "Automate",
    blurb: "Rules and actions",
    status: "upcoming",
  },
  {
    id: 12,
    name: "AI",
    blurb: "Assist and summarize",
    status: "upcoming",
  },
  {
    id: 13,
    name: "Analytics",
    blurb: "Dashboards and polish",
    status: "upcoming",
    href: "audit",
  },
  {
    id: 14,
    name: "Harden",
    blurb: "Limits, a11y, deploy",
    status: "upcoming",
  },
];

export function phaseCounts(phases: RoadmapPhase[] = ROADMAP_PHASES) {
  return {
    done: phases.filter((p) => p.status === "done").length,
    current: phases.filter((p) => p.status === "current").length,
    upcoming: phases.filter((p) => p.status === "upcoming").length,
    total: phases.length,
  };
}

export type SetupItem = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
  cta: string;
};

export function buildSetupItems(input: {
  orgSlug: string;
  activeWorkspaces: number;
  teamCount: number;
  memberCount: number;
  canAdmin: boolean;
}): SetupItem[] {
  const { orgSlug, activeWorkspaces, teamCount, memberCount, canAdmin } = input;
  return [
    {
      id: "workspace",
      label: "Create a workspace",
      detail: "A product space under your organization",
      done: activeWorkspaces > 0,
      href: `/app/${orgSlug}/workspaces`,
      cta: "Open workspaces",
    },
    {
      id: "team",
      label: "Create a team",
      detail: "Group people inside a workspace",
      done: teamCount > 0,
      href: `/app/${orgSlug}/teams`,
      cta: "Open teams",
    },
    {
      id: "invite",
      label: "Invite a teammate",
      detail: "Grow the organization beyond a solo setup",
      done: memberCount > 1,
      href: `/app/${orgSlug}/settings`,
      cta: canAdmin ? "Invite" : "View settings",
    },
  ];
}
