import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Feed — Latest Confessions",
  description: "Read the latest anonymous confessions and opinions from Parul University students. Like, share, and join the conversation.",
  openGraph: {
    title: "UNFILTERED Feed — Latest Confessions",
    description: "Read the latest anonymous confessions from Parul University students.",
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
