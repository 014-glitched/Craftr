import type { Metadata } from "next";
import { Suspense } from "react";
import { AppProviders } from "@/app/app/providers";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <AppProviders>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AppProviders>
  );
}
