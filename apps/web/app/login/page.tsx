import type { Metadata } from "next";
import { Suspense } from "react";
import { AppProviders } from "@/app/app/providers";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AppProviders>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AppProviders>
  );
}
