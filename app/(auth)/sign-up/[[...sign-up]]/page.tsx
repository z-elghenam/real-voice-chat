import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_32%),linear-gradient(180deg,#020617,#0f172a)] px-4 py-12">
      <SignUp
        appearance={{
          elements: {
            card: "shadow-none bg-slate-950/70 border border-white/10 backdrop-blur-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton:
              "bg-white/5 border border-white/10 text-white hover:bg-white/10",
            formButtonPrimary: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
            footerActionText: "text-slate-400",
            footerActionLink: "text-emerald-300 hover:text-emerald-200",
            formFieldInput:
              "bg-slate-950/70 border border-white/10 text-white placeholder:text-slate-500",
            formFieldLabel: "text-slate-300",
          },
        }}
      />
    </main>
  );
}
