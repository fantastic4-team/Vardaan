import type { Metadata } from "next";
import DocsToc from "@/components/DocsToc";
import SectionPage from "@/components/SectionPage";
import CopyMarkdown from "@/components/docs/CopyMarkdown";
import { ArchitectureDiagram, CallSequenceDiagram, TaskLifecycleDiagram } from "@/components/docs/Diagrams";
import { IconTile } from "@/components/docs/Icon";
import {
  AGENT_TEXT,
  API,
  API_NEXT,
  ARCHITECTURE_TEXT,
  CALL_FLOW_TEXT,
  CAPABILITIES,
  CONFIG,
  DATA,
  FREE,
  FREE_TEXT,
  INTRO,
  LIFECYCLE_TEXT,
  LIMITS,
  MODES,
  OVERVIEW,
  PRINCIPLES,
  ROADMAP,
  SECURITY,
  SETUP,
  STACK,
  STATS,
  STATUS,
  TOC,
  TOOLS,
  docsMarkdown,
  type IconName,
} from "@/lib/docs-content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How Vardaan works: the idea, architecture, call flow, agent, features, setup, configuration, API, security and roadmap.",
  alternates: { canonical: "/docs" },
};

const entry = (id: string) => {
  const i = TOC.findIndex((t) => t.id === id);
  return { n: String(i + 1).padStart(2, "0"), ...TOC[i] };
};

function Section({ id, lead, children }: { id: string; lead?: React.ReactNode; children?: React.ReactNode }) {
  const e = entry(id);
  return (
    <section aria-labelledby={id} className="nav-grid border-t pt-12 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-4">
        <IconTile name={e.icon} />
        <div>
          <p className="text-[12px] tabular-nums tracking-[0.16em] text-mute">{e.n}</p>
          <h2 id={id} className="scroll-mt-24 text-[clamp(24px,2.8vw,32px)] font-medium leading-tight tracking-[-0.02em] text-ink">
            {e.label}
          </h2>
        </div>
      </div>
      {lead && <div className="mt-5 max-w-[680px] space-y-4 text-[16px] leading-[27px] text-ink/70">{lead}</div>}
      {children}
    </section>
  );
}

function Table({ head, rows, min = 600 }: { head: string[]; rows: React.ReactNode[][]; min?: number }) {
  return (
    <div className="app-panel mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[14px]" style={{ minWidth: min }}>
        <thead>
          <tr className="text-[12px] uppercase tracking-[0.12em] text-mute">
            {head.map((h) => (
              <th key={h} className="border-b border-white/10 px-5 py-3.5 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top transition-colors hover:bg-white/[0.02]">
              {r.map((cell, j) => (
                <td key={j} className={`border-b border-white/[0.06] px-5 py-4 ${j === 0 ? "text-ink" : "text-ink/65"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded-[6px] border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] text-ink/90">{children}</code>
);

function Card({ title, icon, children }: { title: string; icon?: IconName; children: React.ReactNode }) {
  return (
    <div className="app-panel p-6 transition-colors hover:border-white/20">
      {icon && <IconTile name={icon} size="sm" />}
      <h3 className={`${icon ? "mt-4" : ""} text-[17px] font-medium text-ink`}>{title}</h3>
      <p className="mt-2 text-[14px] leading-[22px] text-ink/65">{children}</p>
    </div>
  );
}

const Pill = ({ status }: { status: keyof typeof STATUS }) => (
  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] ${STATUS[status].tone}`}>{STATUS[status].label}</span>
);

export default function Docs() {
  return (
    <SectionPage eyebrow="Docs · Private beta" title="How Vardaan works." intro={INTRO} scene="lotus">
      <div className="grid gap-12 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-16">
        <DocsToc items={TOC} />

        <div className="min-w-0">
          <div className="app-panel mb-14 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="text-[13px] text-ink/60">
              <span className="text-ink/85">{TOC.length} sections</span> · 3 diagrams · updated with every release
            </div>
            <CopyMarkdown markdown={docsMarkdown(site.url)} />
          </div>

          <div className="space-y-16">
            <Section id="overview" lead={OVERVIEW.map((p) => <p key={p}>{p}</p>)}>
              <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label} className="app-panel p-5">
                    <dt className="text-[34px] font-medium leading-none tracking-[-0.03em] text-ink">{s.value}</dt>
                    <dd className="mt-2 text-[13px] text-ink/60">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section id="modes">
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {MODES.map((m) => (
                  <Card key={m.title} title={m.title} icon={m.icon}>
                    {m.body}
                  </Card>
                ))}
              </div>
            </Section>

            <Section id="architecture" lead={<p>{ARCHITECTURE_TEXT}</p>}>
              <ArchitectureDiagram />
            </Section>

            <Section id="call-flow" lead={<p>{CALL_FLOW_TEXT}</p>}>
              <CallSequenceDiagram />
            </Section>

            <Section id="lifecycle" lead={<p>{LIFECYCLE_TEXT}</p>}>
              <TaskLifecycleDiagram />
            </Section>

            <Section id="agent" lead={<p>{AGENT_TEXT}</p>}>
              <Table head={["Tool", "What it does", "Mode"]} rows={TOOLS.map((t) => [<Code key="c">{t.name}</Code>, t.does, t.mode])} />
            </Section>

            <Section id="capabilities" lead={<p>Everything marked Live works today on a local setup. Nothing on this list is simulated.</p>}>
              <div className="mt-6 flex flex-wrap gap-2 text-[12px] text-ink/60">
                {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => (
                  <span key={k} className="flex items-center gap-2">
                    <Pill status={k} />
                    {k === "live" ? "works today" : k === "next" ? "being built" : k === "later" ? "planned" : "out of scope"}
                  </span>
                ))}
              </div>
              <Table
                head={["Feature", "Status", "Needs"]}
                rows={CAPABILITIES.map((c) => [
                  <>
                    <p>{c.name}</p>
                    <p className="mt-1 text-[13px] leading-[20px] text-ink/55">{c.detail}</p>
                  </>,
                  <Pill key="s" status={c.status} />,
                  c.needs,
                ])}
              />
            </Section>

            <Section id="free" lead={<p>{FREE_TEXT}</p>}>
              <Table head={["Part", "Free option", "When it costs money"]} rows={FREE.map((f) => [f.what, f.free, f.paid])} />
            </Section>

            <Section id="limits">
              <div className="mt-6 rounded-[16px] border border-[#f6e27a]/25 bg-[#f6e27a]/[0.05] p-6">
                {LIMITS.map((p, i) => (
                  <p key={p} className={`${i ? "mt-4" : ""} max-w-[680px] text-[15px] leading-[26px] text-ink/75`}>
                    {p}
                  </p>
                ))}
              </div>
            </Section>

            <Section id="setup" lead={<p>No coding needed: sign up for the services and copy keys into one file.</p>}>
              <ol className="mt-8 grid gap-4 md:grid-cols-2">
                {SETUP.map((s, i) => (
                  <li key={s.title} className="app-panel p-6">
                    <div className="flex items-center justify-between">
                      <IconTile name={s.icon} size="sm" />
                      <span className="text-[12px] tabular-nums text-mute">Step {i + 1}</span>
                    </div>
                    <h3 className="mt-4 text-[17px] font-medium text-ink">{s.title}</h3>
                    <p className="mt-2 text-[14px] leading-[22px] text-ink/65">{s.body}</p>
                    {s.link && (
                      <a href={s.link.href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13px] text-[#b9e0ff] underline underline-offset-2 hover:text-white">
                        {s.link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="config" lead={<p>Settings go in <Code>.env.local</Code> in the project folder. A template with comments is in <Code>.env.example</Code>.</p>}>
              <Table head={["Setting", "Required", "Purpose"]} min={680} rows={CONFIG.map((c) => [<Code key="c">{c.key}</Code>, c.req, c.desc])} />
            </Section>

            <Section id="api" lead={<p>All routes except signup, login and the waitlist require a signed-in session.</p>}>
              <Table
                head={["Method", "Route", "Description"]}
                min={640}
                rows={API.map((a) => [
                  <span key="m" className={`font-mono text-[12.5px] ${a.method === "GET" ? "text-[#c9e877]" : a.method === "DELETE" ? "text-[#ffb4a8]" : "text-[#b9e0ff]"}`}>
                    {a.method}
                  </span>,
                  <Code key="p">{a.path}</Code>,
                  a.desc,
                ])}
              />
              <p className="mt-6 text-[14px] text-ink/60">Coming with the phone line and Telegram:</p>
              <ul className="mt-3 space-y-2 text-[14px] text-ink/60">
                {API_NEXT.map((a) => (
                  <li key={a.path}>
                    <Code>{a.path}</Code> — {a.desc}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="data" lead={<p>Stored in a local file for development, moving to a hosted database before launch.</p>}>
              <Table head={["Record", "Fields"]} min={520} rows={DATA.map((d) => [d.name, d.fields])} />
            </Section>

            <Section id="security">
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SECURITY.map((s) => (
                  <Card key={s.title} title={s.title} icon={s.icon}>
                    {s.body}
                  </Card>
                ))}
              </div>
            </Section>

            <Section id="stack">
              <Table head={["Area", "Tool", "Cost"]} rows={STACK.map((s) => [s.area, s.tool, s.cost])} />
            </Section>

            <Section id="roadmap">
              <ol className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {ROADMAP.map((r, i) => (
                  <li key={r.phase} className="app-panel relative p-6">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-[#c9e877]" : i === 1 ? "bg-[#8ccbff]" : "bg-white/30"}`} />
                      <h3 className="text-[13px] uppercase tracking-[0.14em] text-mute">{r.phase}</h3>
                    </div>
                    <ul className="mt-4 space-y-2.5 text-[14px] leading-[21px] text-ink/75">
                      {r.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span aria-hidden="true" className="text-ink/35">
                            ·
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="principles">
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {PRINCIPLES.map((p) => (
                  <Card key={p.title} title={p.title} icon={p.icon}>
                    {p.body}
                  </Card>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </SectionPage>
  );
}
