export { slugifyName } from "@craftr/validation";

export async function uniqueOrgSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = base || "org";
  let suffix = 0;
  while (await exists(slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function uniqueWorkspaceSlug(
  base: string,
  organizationId: string,
  exists: (organizationId: string, slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = base || "workspace";
  let suffix = 0;
  while (await exists(organizationId, slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function uniqueTeamSlug(
  base: string,
  workspaceId: string,
  exists: (workspaceId: string, slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = base || "team";
  let suffix = 0;
  while (await exists(workspaceId, slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
