import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Discover — Trending Posts",
  description: "Discover trending anonymous confessions from Parul University. Swipe through the hottest takes and opinions on campus.",
  openGraph: {
    title: "UNFILTERED Discover — Trending Posts",
    description: "Swipe through trending anonymous confessions from Parul University students.",
  },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
