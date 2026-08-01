import { AppProviders } from "@/app/app/providers";

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProviders>{children}</AppProviders>;
}
