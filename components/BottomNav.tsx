'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, User, Flame } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <Link href="/feed" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/feed' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          <Home size={24} strokeWidth={pathname === '/feed' ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>
        <Link href="/discover" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/discover' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          <Flame size={24} strokeWidth={pathname === '/discover' ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Discover</span>
        </Link>
        <Link href="/saved" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/saved' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          <Bookmark size={24} strokeWidth={pathname === '/saved' ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Saved</span>
        </Link>
        <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/profile' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          <User size={24} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
}
