import { z } from "zod";

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const orgNameSchema = z
  .string()
  .trim()
  .min(1, "Organization name is required.")
  .min(2, "Name must be at least 2 characters.")
  .max(80, "Name must be 80 characters or fewer.");

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Workspace name is required.")
  .min(2, "Name must be at least 2 characters.")
  .max(80, "Name must be 80 characters or fewer.");

export const teamNameSchema = z
  .string()
  .trim()
  .min(1, "Team name is required.")
  .min(2, "Name must be at least 2 characters.")
  .max(80, "Name must be 80 characters or fewer.");

const slugValueSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (!value) return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use lowercase letters, numbers, and hyphens only.",
      });
    }
    if (value.length > 48) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Slug must be 48 characters or fewer.",
      });
    }
  });

export const optionalSlugSchema = slugValueSchema.optional();

export const inviteEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

export const createOrganizationSchema = z.object({
  name: orgNameSchema,
  slug: optionalSlugSchema,
});

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  slug: optionalSlugSchema,
});

export const updateOrganizationSchema = z
  .object({
    name: orgNameSchema.optional(),
    slug: slugValueSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: "At least one field is required.",
  });

export const updateWorkspaceSchema = z
  .object({
    name: workspaceNameSchema.optional(),
    slug: slugValueSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: "At least one field is required.",
  });

export const createTeamSchema = z.object({
  name: teamNameSchema,
  slug: optionalSlugSchema,
});

export const updateTeamSchema = z
  .object({
    name: teamNameSchema.optional(),
    slug: slugValueSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: "At least one field is required.",
  });

export const teamOwnershipChangeTypeSchema = z.enum([
  "TRANSFER",
  "CO_OWNER",
  "REQUEST",
]);

export const createTeamOwnershipChangeSchema = z
  .object({
    teamId: z.string().min(1),
    type: teamOwnershipChangeTypeSchema,
    counterpartyUserId: z.string().min(1).optional(),
    message: z.string().trim().max(280).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "REQUEST") {
      if (data.counterpartyUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Requests do not take a counterparty.",
          path: ["counterpartyUserId"],
        });
      }
      return;
    }
    if (!data.counterpartyUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a team member to offer ownership to.",
        path: ["counterpartyUserId"],
      });
    }
  });

export const respondTeamOwnershipChangeSchema = z.object({
  changeId: z.string().min(1),
  accept: z.boolean(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateTeamOwnershipChangeInput = z.infer<
  typeof createTeamOwnershipChangeSchema
>;
