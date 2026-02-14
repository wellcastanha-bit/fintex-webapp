// app/(mobile)/m/page.tsx
import Link from "next/link";

function Card({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        padding: 20,
        borderRadius: 22,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        border: "1.5px solid rgba(79,220,255,0.45)", // 🔥 borda mais forte
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.15) inset, 0 18px 40px rgba(0,0,0,0.45)",
        marginBottom: 16,
        color: "inherit",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(79,220,255,0.08)",
            border: "1px solid rgba(79,220,255,0.35)",
            flex: "0 0 auto",
          }}
        >
          <div style={{ color: "#4fdcff" }}>{icon}</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            {title}
          </div>

          <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>
            {subtitle}
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Abrir</span>
            <span style={{ opacity: 0.6 }}>›</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3v2M17 3v2M3.5 9h17M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBag() {
  return (
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path
    d="M5 12h14M13 6l6 6-6 6"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>

  );
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 19V5M20 19H4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 16l3-4 3 2 4-6"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function MobileHome() {
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>
          Visão rápida
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          Acesso rápido às principais informações.
        </div>
      </div>

      <Card
        href="/m/reservas"
        title="Reservas"
        subtitle="Agenda de Reservas"
        icon={<IconCalendar />}
      />

      <Card
        href="/m/pedidos"
        title="Pedidos"
        subtitle="Pedidos Diários"
        icon={<IconBag />}
      />

      <Card
        href="/m/dashboard"
        title="Dashboard"
        subtitle="KPIs e conferências"
        icon={<IconChart />}
      />
    </div>
  );
}
