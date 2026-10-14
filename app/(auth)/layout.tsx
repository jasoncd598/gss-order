// Shared layout for all (auth) routes.
// No nav or sidebar — just the full-screen dark background shared by all auth pages.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
