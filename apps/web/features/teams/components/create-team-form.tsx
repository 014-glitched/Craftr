"use client";

import { useMutation } from "@apollo/client/react";
import { FormEvent, useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { AuthField } from "@/features/auth/components/auth-field";
import {
  CREATE_TEAM,
  WORKSPACE_TEAMS,
  type CreateTeamMutation,
} from "@/features/teams/graphql/operations";
import { apolloErrorMessage } from "@/lib/apollo-errors";
import {
  createTeamSchema,
  safeParseFields,
  slugifyName,
} from "@/lib/tenancy-validation";

export function CreateTeamForm({
  workspaceId,
  onCreated,
  variant = "inline",
}: {
  workspaceId: string;
  onCreated?: (team: { slug: string; id: string }) => void;
  variant?: "inline" | "modal";
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [createTeam, { loading }] =
    useMutation<CreateTeamMutation>(CREATE_TEAM);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = safeParseFields<"name" | "slug">(createTeamSchema, {
      name,
      slug: slug.trim() || undefined,
    });
    if (!parsed.success) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});

    try {
      const result = await createTeam({
        variables: {
          input: {
            workspaceId,
            name: parsed.data.name,
            slug: parsed.data.slug || undefined,
          },
        },
        refetchQueries: [
          { query: WORKSPACE_TEAMS, variables: { workspaceId } },
        ],
      });

      if (result.error) {
        setFormError(apolloErrorMessage(result.error, "Unable to create team."));
        return;
      }

      const team = result.data?.createTeam;
      if (!team) {
        setFormError("Unable to create team.");
        return;
      }

      setName("");
      setSlug("");
      setSlugTouched(false);
      onCreated?.({ slug: team.slug, id: team.id });
    } catch (error) {
      setFormError(apolloErrorMessage(error, "Unable to create team."));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <AuthField
        id="team-name"
        label="Team name"
        placeholder="Platform"
        value={name}
        error={errors.name}
        onChange={(ev) => {
          const v = ev.target.value;
          setName(v);
          if (!slugTouched) setSlug(slugifyName(v));
          if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
        }}
      />
      <AuthField
        id="team-slug"
        label="Slug"
        value={slug}
        error={errors.slug}
        onChange={(ev) => {
          setSlugTouched(true);
          setSlug(ev.target.value);
          if (errors.slug) setErrors((e) => ({ ...e, slug: undefined }));
        }}
      />
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 text-sm text-danger"
        >
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}
      <div
        className={
          variant === "modal"
            ? "flex justify-end gap-2 pt-2"
            : undefined
        }
      >
        <button
          type="submit"
          disabled={loading}
          className={
            variant === "modal"
              ? "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              : "inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas active:scale-[0.98] disabled:opacity-60"
          }
        >
          {loading ? (
            <CircleNotch weight="bold" className="size-4 animate-spin" />
          ) : null}
          Create team
        </button>
      </div>
    </form>
  );
}
