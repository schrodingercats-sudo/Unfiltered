import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to UNFILTERED — the anonymous confession board for Parul University students.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
