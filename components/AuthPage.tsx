import AuthForm from "@/components/AuthForm";
import PosterArt from "@/components/PosterArt";
import SiteNav from "@/components/SiteNav";

const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

// Login and sign-up share the home page's split layout: the form on the left, the poster on the right.
export default function AuthPage({ mode, title, intro }: { mode: "login" | "signup"; title: string; intro: string }) {
  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <SiteNav />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col justify-center px-[max(1.5rem,calc(6vw+1.75rem))] py-12 lg:pr-12">
          <p className="reveal text-[12px] uppercase tracking-[0.18em] text-mute" style={step(0)}>
            Vardaan Beta
          </p>
          <h1
            className="reveal mt-4 text-[clamp(34px,5vh,52px)] font-medium leading-[1.04] tracking-[-0.03em] text-ink"
            style={step(1)}
          >
            {title}
          </h1>
          <p className="reveal mt-4 max-w-[420px] text-[15px] leading-[23px] text-ink/70" style={step(2)}>
            {intro}
          </p>
          <div className="reveal mt-8" style={step(3)}>
            <AuthForm mode={mode} />
          </div>
        </div>

        <figure className="poster-art-in nav-grid relative hidden overflow-hidden lg:block lg:border-l">
          <PosterArt className="absolute inset-0 h-full w-full" />
          <div aria-hidden="true" className="poster-grain pointer-events-none absolute inset-0" />
        </figure>
      </main>
    </div>
  );
}
