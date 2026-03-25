import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Profile",
  description: "View your UNFILTERED profile, posts, and activity.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
