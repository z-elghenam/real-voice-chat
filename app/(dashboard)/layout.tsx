import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_26%),linear-gradient(180deg,#020617,#0f172a_45%,#020617)] text-white">
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/25">
              VC
            </div>
            <div>
              <div className="text-sm font-medium text-sky-200">Real Voice Chat</div>
              <div className="text-xs text-slate-400">Production-ready room hub</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:block">
              Protected by Clerk
            </div>
            <UserButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
