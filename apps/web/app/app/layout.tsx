import { AppProviders } from "./providers";
import { AppShell } from "@/features/app/components/app-shell";
import { TenancyGate } from "@/features/tenancy/components/tenancy-gate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <AppShell>
        <TenancyGate>{children}</TenancyGate>
      </AppShell>
    </AppProviders>
  );
}
