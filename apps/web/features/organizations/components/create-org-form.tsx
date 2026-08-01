"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { AuthField } from "@/features/auth/components/auth-field";
import {
  CREATE_ORGANIZATION,
  MY_ORGANIZATIONS,
  type CreateOrganizationMutation,
} from "@/features/organizations/graphql/operations";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";
import { apolloErrorMessage } from "@/lib/apollo-errors";
import {
  createOrganizationSchema,
  safeParseFields,
  slugifyName,
} from "@/lib/tenancy-validation";

export function CreateOrgForm() {
  const router = useRouter();
  const setActiveWorkspace = useTenancyStore((s) => s.setActiveWorkspace);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [createOrganization, { loading }] =
    useMutation<CreateOrganizationMutation>(CREATE_ORGANIZATION);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyName(value));
    }
    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsed = safeParseFields<"name" | "slug">(createOrganizationSchema, {
      name,
      slug: slug.trim() || undefined,
    });
    if (!parsed.success) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});

    try {
      const result = await createOrganization({
        variables: {
          input: {
            name: parsed.data.name,
            slug: parsed.data.slug || undefined,
          },
        },
        refetchQueries: [{ query: MY_ORGANIZATIONS }],
        awaitRefetchQueries: true,
      });

      if (result.error) {
        setFormError(
          apolloErrorMessage(
            result.error,
            "Unable to create organization. Try a different name.",
          ),
        );
        return;
      }

      const payload = result.data?.createOrganization;
      if (!payload) {
        setFormError("Unable to create organization.");
        return;
      }

      setActiveWorkspace({
        id: payload.defaultWorkspace.id,
        slug: payload.defaultWorkspace.slug,
        orgSlug: payload.defaultWorkspace.orgSlug,
        organizationId: payload.organization.id,
      });

      setSuccessMessage(
        `Created ${payload.organization.name}. Opening workspace…`,
      );

      router.replace(
        `/app/${payload.defaultWorkspace.orgSlug}/${payload.defaultWorkspace.slug}`,
      );
    } catch (error) {
      setFormError(
        apolloErrorMessage(
          error,
          "Unable to create organization. Try a different name.",
        ),
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <AuthField
        id="org-name"
        label="Organization name"
        placeholder="Acme Engineering"
        value={name}
        error={errors.name}
        onChange={(ev) => onNameChange(ev.target.value)}
      />
      <AuthField
        id="org-slug"
        label="URL slug"
        placeholder="acme-engineering"
        hint="Used in workspace URLs"
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
          className="flex items-start gap-2 rounded-[10px] border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-[10px] border border-brand/20 bg-brand-soft px-3 py-2.5 text-sm text-ink"
        >
          <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || Boolean(successMessage)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent px-4 py-3 text-sm font-semibold text-accent-fg transition-[transform,opacity] enabled:hover:opacity-90 enabled:active:scale-[0.985] disabled:opacity-60"
      >
        {loading ? (
          <>
            <CircleNotch weight="bold" className="size-4 animate-spin" />
            Creating…
          </>
        ) : successMessage ? (
          "Redirecting…"
        ) : (
          "Create organization"
        )}
      </button>
    </form>
  );
}
