// Diagrams for the docs page, drawn as inline SVG in the site's palette. Each scales to its
// container and scrolls sideways on narrow screens rather than shrinking text to unreadable sizes.

const C = {
  line: "rgba(244,242,238,0.28)",
  faint: "rgba(244,242,238,0.12)",
  box: "rgba(255,255,255,0.04)",
  ink: "#f4f2ee",
  mute: "rgba(244,242,238,0.55)",
  accent: "#8ccbff",
  accentFill: "rgba(140,203,255,0.10)",
  lime: "#c9e877",
  warn: "#f6e27a",
  red: "#ffb4a8",
};

function Arrow({ id, color = C.line }: { id: string; color?: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill={color} />
    </marker>
  );
}

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  tone = "default",
  tag,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  tone?: "default" | "accent";
  tag?: { label: string; color: string };
}) {
  const accent = tone === "accent";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={accent ? C.accentFill : C.box} stroke={accent ? C.accent : C.line} />
      <text x={x + 16} y={y + (sub ? 28 : h / 2 + 5)} fill={C.ink} fontSize={15} fontWeight={500}>
        {title}
      </text>
      {sub && (
        <text x={x + 16} y={y + 48} fill={C.mute} fontSize={12.5}>
          {sub}
        </text>
      )}
      {tag && (
        <g>
          <rect x={x + w - 58} y={y + 12} width={46} height={20} rx={10} fill="rgba(255,255,255,0.06)" />
          <text x={x + w - 35} y={y + 26} fill={tag.color} fontSize={11} textAnchor="middle">
            {tag.label}
          </text>
        </g>
      )}
    </g>
  );
}

function Frame({ label, children, minWidth }: { label: string; children: React.ReactNode; minWidth: number }) {
  return (
    <figure className="app-panel mt-8 overflow-x-auto p-4 sm:p-6">
      <div style={{ minWidth }}>{children}</div>
      <figcaption className="mt-4 text-center text-[13px] text-ink/50">{label}</figcaption>
    </figure>
  );
}

const LIVE = { label: "Live", color: C.lime };
const NEXT = { label: "Next", color: C.accent };

export function ArchitectureDiagram() {
  const channels = [
    { y: 60, title: "Web console", sub: "Voice in the browser", tag: LIVE },
    { y: 170, title: "Phone call", sub: "Twilio / Exotel", tag: NEXT },
    { y: 280, title: "Telegram", sub: "Voice notes, free", tag: NEXT },
  ];
  const services = [
    { y: 40, title: "AI model", sub: "Groq · Gemini · Ollama" },
    { y: 128, title: "Database", sub: "Users, tasks, memory" },
    { y: 216, title: "Email", sub: "Gmail over SMTP" },
    { y: 304, title: "SMS & WhatsApp", sub: "Twilio · your own apps" },
  ];
  return (
    <Frame label="System architecture. Every channel reaches the same backend and agent." minWidth={760}>
      <svg viewBox="0 0 960 400" role="img" aria-label="Architecture: channels connect to the Vardaan backend, which uses the AI model, database, email and messaging services." className="h-auto w-full">
        <defs>
          <Arrow id="ar-a" />
          <Arrow id="ar-b" color={C.accent} />
        </defs>

        <text x={20} y={30} fill={C.mute} fontSize={12} letterSpacing={1.5}>
          CHANNELS
        </text>
        {channels.map((c) => (
          <Box key={c.title} x={20} y={c.y} w={210} h={70} title={c.title} sub={c.sub} tag={c.tag} />
        ))}

        <text x={300} y={30} fill={C.mute} fontSize={12} letterSpacing={1.5}>
          VARDAAN BACKEND · NEXT.JS
        </text>
        <rect x={300} y={44} width={320} height={320} rx={16} fill="none" stroke={C.faint} strokeDasharray="5 6" />
        <Box x={320} y={64} w={280} h={70} title="API routes" sub="Auth, sessions, webhooks" />
        <Box x={320} y={170} w={280} h={70} title="Agent" sub="Understands, plans, uses tools" tone="accent" />
        <Box x={320} y={276} w={280} h={70} title="Task runner" sub="Call & Cut, in the background" />
        <path d="M460 134 V170" stroke={C.line} markerEnd="url(#ar-a)" />
        <path d="M460 240 V276" stroke={C.line} markerEnd="url(#ar-a)" />

        {channels.map((c) => (
          <path key={c.y} d={`M230 ${c.y + 35} C 270 ${c.y + 35}, 280 99, 320 99`} fill="none" stroke={C.line} markerEnd="url(#ar-a)" />
        ))}

        <text x={700} y={30} fill={C.mute} fontSize={12} letterSpacing={1.5}>
          SERVICES
        </text>
        {services.map((s) => (
          <Box key={s.title} x={700} y={s.y} w={240} h={64} title={s.title} sub={s.sub} />
        ))}
        {services.map((s) => (
          <path key={s.y} d={`M600 205 C 650 205, 650 ${s.y + 32}, 700 ${s.y + 32}`} fill="none" stroke={C.accent} strokeOpacity={0.7} markerEnd="url(#ar-b)" />
        ))}
      </svg>
    </Frame>
  );
}

export function CallSequenceDiagram() {
  const lanes = [
    { x: 110, label: "You" },
    { x: 360, label: "Twilio" },
    { x: 610, label: "Vardaan" },
    { x: 860, label: "AI model" },
  ];
  const msgs: { from: number; to: number; y: number; text: string; reply?: boolean; tone?: string }[] = [
    { from: 0, to: 1, y: 110, text: "1  Calls, or presses “Call me”" },
    { from: 1, to: 2, y: 150, text: "2  Caller ID + your speech as text" },
    { from: 2, to: 3, y: 190, text: "3  Request + memory + tools" },
    { from: 3, to: 2, y: 230, text: "4  Reply, or a plan", reply: true },
    { from: 2, to: 1, y: 270, text: "5  Text to speak", reply: true },
    { from: 1, to: 0, y: 310, text: "6  You hear the answer", reply: true },
    { from: 0, to: 1, y: 350, text: "7  You hang up (Call & Cut)" },
    { from: 2, to: 0, y: 450, text: "9  SMS: “Done” or “Approve? Reply YES”", reply: true, tone: C.lime },
  ];
  return (
    <Frame label="A call from start to finish. Steps 1–6 repeat for each thing you say." minWidth={780}>
      <svg viewBox="0 0 960 490" role="img" aria-label="Sequence of a call between you, Twilio, Vardaan and the AI model." className="h-auto w-full">
        <defs>
          <Arrow id="sq-a" color={C.ink} />
          <Arrow id="sq-b" color={C.mute} />
          <Arrow id="sq-c" color={C.lime} />
        </defs>
        {lanes.map((l) => (
          <g key={l.label}>
            <rect x={l.x - 70} y={20} width={140} height={44} rx={12} fill={l.label === "Vardaan" ? C.accentFill : C.box} stroke={l.label === "Vardaan" ? C.accent : C.line} />
            <text x={l.x} y={48} fill={C.ink} fontSize={15} fontWeight={500} textAnchor="middle">
              {l.label}
            </text>
            <path d={`M${l.x} 64 V480`} stroke={C.faint} strokeDasharray="4 6" />
          </g>
        ))}

        {msgs.map((m) => {
          const x1 = lanes[m.from].x;
          const x2 = lanes[m.to].x;
          const dir = x2 > x1 ? 1 : -1;
          const color = m.tone ?? (m.reply ? C.mute : C.ink);
          const marker = m.tone ? "sq-c" : m.reply ? "sq-b" : "sq-a";
          return (
            <g key={m.y}>
              <path d={`M${x1 + dir * 6} ${m.y} H${x2 - dir * 8}`} stroke={color} strokeDasharray={m.reply ? "6 5" : undefined} markerEnd={`url(#${marker})`} />
              <text x={(x1 + x2) / 2} y={m.y - 9} fill={color} fontSize={12.5} textAnchor="middle">
                {m.text}
              </text>
            </g>
          );
        })}

        <rect x={520} y={378} width={180} height={46} rx={10} fill={C.accentFill} stroke={C.accent} />
        <text x={610} y={398} fill={C.ink} fontSize={13} textAnchor="middle">
          8  Works in the background
        </text>
        <text x={610} y={414} fill={C.mute} fontSize={11.5} textAnchor="middle">
          plans · drafts · asks if needed
        </text>
      </svg>
    </Frame>
  );
}

export function TaskLifecycleDiagram() {
  type N = { id: string; x: number; y: number; label: string; color: string };
  const nodes: N[] = [
    { id: "planning", x: 30, y: 145, label: "Planning", color: C.ink },
    { id: "working", x: 230, y: 145, label: "Working", color: C.accent },
    { id: "input", x: 470, y: 60, label: "Needs your answer", color: C.warn },
    { id: "approval", x: 470, y: 230, label: "Needs approval", color: C.warn },
    { id: "done", x: 730, y: 145, label: "Done", color: C.lime },
    { id: "failed", x: 230, y: 255, label: "Couldn't finish", color: C.red },
  ];
  const W = 170;
  const H = 46;
  const n = Object.fromEntries(nodes.map((x) => [x.id, x])) as Record<string, N>;
  const mid = (id: string, side: "l" | "r" | "t" | "b") => {
    const k = n[id];
    if (side === "l") return [k.x, k.y + H / 2];
    if (side === "r") return [k.x + W, k.y + H / 2];
    if (side === "t") return [k.x + W / 2, k.y];
    return [k.x + W / 2, k.y + H];
  };
  // Labels sit beside their arrow, offset by (dx, dy) from the midpoint so they never overlap the line.
  const edge = (a: number[], b: number[], label: string, dx = 0, dy = -7, anchor: "start" | "middle" | "end" = "middle") => ({
    d: `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`,
    label,
    lx: (a[0] + b[0]) / 2 + dx,
    ly: (a[1] + b[1]) / 2 + dy,
    anchor,
  });
  const edges = [
    edge(mid("planning", "r"), mid("working", "l"), ""),
    edge(mid("working", "r"), mid("input", "l"), "missing info", -8, -4, "end"),
    edge(mid("working", "r"), mid("approval", "l"), "draft ready", -8, 14, "end"),
    edge(mid("working", "r"), mid("done", "l"), "nothing to approve", 0, -9),
    edge(mid("approval", "r"), mid("done", "l"), "you approve", 10, 14, "start"),
    edge(mid("working", "b"), mid("failed", "t"), "error", 8, 4, "start"),
  ];
  const back = mid("input", "t");
  const plan = mid("planning", "t");
  return (
    <Frame label="Every Call & Cut task moves through these states. You only act at the yellow ones." minWidth={760}>
      <svg viewBox="0 0 920 320" role="img" aria-label="Task states: planning, working, needs your answer, needs approval, done, couldn't finish." className="h-auto w-full">
        <defs>
          <Arrow id="lc-a" />
        </defs>
        {edges.map((e, i) => (
          <g key={i}>
            <path d={e.d} fill="none" stroke={C.line} markerEnd="url(#lc-a)" />
            {e.label && (
              <text x={e.lx} y={e.ly} fill={C.mute} fontSize={12} textAnchor={e.anchor}>
                {e.label}
              </text>
            )}
          </g>
        ))}
        <path d={`M${back[0]} ${back[1]} C ${back[0]} 6, ${plan[0]} 6, ${plan[0]} ${plan[1] - 2}`} fill="none" stroke={C.line} strokeDasharray="5 5" markerEnd="url(#lc-a)" />
        <text x={(back[0] + plan[0]) / 2} y={14} fill={C.mute} fontSize={12} textAnchor="middle">
          you reply → it picks the task back up
        </text>
        {nodes.map((k) => (
          <g key={k.id}>
            <rect x={k.x} y={k.y} width={W} height={H} rx={23} fill={C.box} stroke={k.color} strokeOpacity={0.7} />
            <text x={k.x + W / 2} y={k.y + 28} fill={k.color} fontSize={14} textAnchor="middle">
              {k.label}
            </text>
          </g>
        ))}
      </svg>
    </Frame>
  );
}
