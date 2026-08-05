"use client";

import { useQuery } from "@apollo/client/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { MY_ORGANIZATIONS } from "@/features/organizations/graphql/operations";
import type { MyOrganizationsQuery } from "@/features/organizations/graphql/operations";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";

const BYPASS_PREFIXES = ["/invite"];

export function TenancyGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeOrgSlug, setActiveOrg } = useTenancyStore();

  const { data, loading } = useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS, {
    fetchPolicy: "cache-and-network",
  });

  const orgs = data?.myOrganizations;
  const hasOrgData = Array.isArray(orgs);
  const isOnboarding = pathname.startsWith("/app/onboarding");
  const isBypass = BYPASS_PREFIXES.some((p) => pathname.startsWith(p));
  // Initial load only — avoid treating a refetch as "no data yet"
  const isInitialLoading = loading && !hasOrgData;

  useEffect(() => {
    if (isBypass || isInitialLoading || !hasOrgData) return;

    if (orgs.length === 0) {
      if (!isOnboarding) {
        router.replace("/app/onboarding");
      }
      return;
    }

    // Already has orgs — leave onboarding for home
    if (isOnboarding) {
      const org = orgs.find((o) => o.slug === activeOrgSlug) ?? orgs[0];
      setActiveOrg({ id: org.id, slug: org.slug });
      router.replace("/app");
      return;
    }

    // `/app` is the real org home — only ensure active org is set
    if (pathname === "/app") {
      const org = orgs.find((o) => o.slug === activeOrgSlug) ?? orgs[0];
      setActiveOrg({ id: org.id, slug: org.slug });
    }
  }, [
    isInitialLoading,
    hasOrgData,
    orgs,
    pathname,
    router,
    isBypass,
    isOnboarding,
    activeOrgSlug,
    setActiveOrg,
  ]);

  if (isInitialLoading && !isBypass) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        <CircleNotch weight="bold" className="size-5 animate-spin text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
