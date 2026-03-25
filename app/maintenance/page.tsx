'use client';

import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Pinterest image embed */}
        <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-2xl mx-auto" style={{ maxWidth: 345 }}>
          <iframe 
            src="https://assets.pinterest.com/ext/embed.html?id=4503668371743392" 
            height="528" 
            width="345" 
            frameBorder="0" 
            scrolling="no"
            className="block"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
            We&apos;re at Capacity
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
            UNFILTERED is experiencing high traffic right now. We can currently handle around <strong className="text-white">200–500 users</strong> simultaneously on the free tier.
          </p>
          <p className="text-gray-500 text-sm">
            Please check back in a few minutes. We appreciate your patience.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Try Again
          </Link>
          <p className="text-gray-600 text-xs">
            New project launching soon — stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}
