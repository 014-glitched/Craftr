"use client";

import { useMutation } from "@apollo/client/react";
import { FormEvent, useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { AuthField } from "@/features/auth/components/auth-field";
import {
  CREATE_WORKSPACE,
  type CreateWorkspaceMutation,
} from "@/features/organizations/graphql/operations";
import {
  createWorkspaceSchema,
  safeParseFields,
  slugifyName,
} from "@/lib/tenancy-validation";

export function CreateWorkspaceForm({
  organizationId,
  orgSlug,
  onCreated,
}: {
  organizationId: string;
  orgSlug: string;
  onCreated?: (ws: { slug: string; orgSlug: string }) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [createWorkspace, { loading }] =
    useMutation<CreateWorkspaceMutation>(CREATE_WORKSPACE);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = safeParseFields<"name" | "slug">(createWorkspaceSchema, {
      name,
      slug: slug.trim() || undefined,
    });
    if (!parsed.success) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});

    try {
      const { data } = await createWorkspace({
        variables: {
          input: {
            organizationId,
            name: parsed.data.name,
            slug: parsed.data.slug || undefined,
          },
        },
      });

      const ws = data?.createWorkspace;
      if (!ws) {
        setFormError("Unable to create workspace.");
        return;
      }

      setName("");
      setSlug("");
      setSlugTouched(false);
      onCreated?.({ slug: ws.slug, orgSlug: ws.orgSlug ?? orgSlug });
    } catch {
      setFormError("Unable to create workspace.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <AuthField
        id="ws-name"
        label="Workspace name"
        placeholder="Platform team"
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
        id="ws-slug"
        label="Slug"
        value={slug}
        error={errors.slug}
        onChange={(ev) => {
          setSlugTouched(true);
          setSlug(ev.target.value);
        }}
      />
      {formError ? (
        <p className="text-sm text-danger">{formError}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-60"
      >
        {loading ? (
          <CircleNotch weight="bold" className="size-4 animate-spin" />
        ) : null}
        Add workspace
      </button>
    </form>
  );
}
