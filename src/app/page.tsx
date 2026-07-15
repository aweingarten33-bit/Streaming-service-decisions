import { AuthProvider } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/marquee/app-shell";

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
