import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your UNFILTERED account — join the anonymous Parul University confession board and share your thoughts freely.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
