const { useState, useEffect, useRef, useCallback } = React;

/* ---------------------------------------------------------
   THEME
--------------------------------------------------------- */
const C = {
  ink: "#18100E",
  panel: "#241A16",
  panel2: "#2E211C",
  line: "#4A362D",
  text: "#F2E9DE",
  dim: "#B39C8B",
  brass: "#C99A44",
  teal: "#4E9C93",
  red: "#C85C42",
  amber: "#D9A441",
};

/* ---------------------------------------------------------
   STORAGE (localStorage — works offline, per-device)
--------------------------------------------------------- */
const KEYS = {
  clients: "voarcade:clients",
  referrers: "voarcade:referrers",
  invoices: "voarcade:invoices",
  settings: "voarcade:settings",
  sentLog: "voarcade:sentLog",
};

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("save failed", e);
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtMoney = (n) => `\u20AC${Number(n || 0).toFixed(2)}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
};

/* ---------------------------------------------------------
   ICONS — small inline SVGs so the app has zero build step
   and no external icon package dependency.
--------------------------------------------------------- */
function Icon({ path, size = 14, color = "currentColor", viewBox = "0 0 24 24", children }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const Icons = {
  Users: (p) => <Icon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>,
  Receipt: (p) => <Icon {...p}><path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 1V2" /><path d="M8 7h8M8 11h8M8 15h5" /></Icon>,
  Percent: (p) => <Icon {...p}><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></Icon>,
  Plus: (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>,
  Trash: (p) => <Icon {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></Icon>,
  Pencil: (p) => <Icon {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icon>,
  Check: (p) => <Icon {...p}><polyline points="20 6 9 17 4 12" /></Icon>,
  X: (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>,
  Alert: (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>,
  Mail: (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></Icon>,
  Phone: (p) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" /></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></Icon>,
  Send: (p) => <Icon {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Icon>,
  Bolt: (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Icon>,
  Download: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>,
};

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------- */
function VUMeter({ level = 0.5, color = C.brass }) {
  const bars = 12;
  const lit = Math.round(bars * level);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{
          width: 3, height: 4 + (i % 4) * 3, borderRadius: 1,
          background: i < lit ? (i > bars - 3 ? C.red : color) : C.line,
          opacity: i < lit ? 1 : 0.5,
        }} />
      ))}
    </div>
  );
}

function StatusLight({ status }) {
  const map = {
    overdue: { c: C.red, label: "Overdue" },
    soon: { c: C.amber, label: "Due soon" },
    paid: { c: C.teal, label: "Paid" },
    open: { c: C.dim, label: "Open" },
  };
  const s = map[status] || map.open;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: s.c, boxShadow: `0 0 6px ${s.c}`, display: "inline-block" }} />
      <span style={{ fontSize: 12, color: s.c, fontWeight: 600, letterSpacing: 0.3 }}>{s.label}</span>
    </span>
  );
}

function Panel({ children, style }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, ...style }}>{children}</div>;
}
function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1 text-sm" style={{ color: C.dim, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: C.dim, opacity: 0.8 }}>{hint}</span>}
    </label>
  );
}
const inputStyle = { background: C.ink, border: `1px solid ${C.line}`, borderRadius: 6, color: C.text, padding: "8px 10px", fontSize: 14, outline: "none", width: "100%" };
function Input(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function Select(props) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function TextArea(props) { return <textarea {...props} style={{ ...inputStyle, resize: "vertical", ...(props.style || {}) }} />; }

function Btn({ children, onClick, variant = "ghost", style, type = "button", disabled }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${C.line}`, letterSpacing: 0.2, opacity: disabled ? 0.5 : 1 };
  const variants = {
    ghost: { background: "transparent", color: C.dim },
    brass: { background: C.brass, color: C.ink, border: "none" },
    danger: { background: "transparent", color: C.red, borderColor: C.red },
    teal: { background: C.teal, color: C.ink, border: "none" },
  };
  return <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------
   GMAIL INTEGRATION
   Uses Google Identity Services (client-side OAuth) + the
   Gmail REST API to send reminder emails from the user's own
   Gmail account. Requires a Google Cloud OAuth Client ID that
   the user creates themselves (see README.md).
--------------------------------------------------------- */
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function useGmail(settings) {
  const [status, setStatus] = useState("idle"); // idle | ready | connected | error
  const [error, setError] = useState("");
  const tokenClientRef = useRef(null);
  const accessTokenRef = useRef(null);

  const initClient = useCallback(() => {
    if (!settings.gmailClientId) { setStatus("idle"); return; }
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      // Google script not loaded yet — try again shortly.
      setTimeout(initClient, 500);
      return;
    }
    try {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: settings.gmailClientId,
        scope: GMAIL_SCOPE,
        callback: (resp) => {
          if (resp && resp.access_token) {
            accessTokenRef.current = resp.access_token;
            setStatus("connected");
            saveLocal("voarcade:gmailWasConnected", true);
          } else {
            setStatus("error");
            setError("No access token returned.");
          }
        },
        error_callback: (err) => {
          setStatus("error");
          setError((err && err.type) || "Google sign-in was cancelled or blocked.");
        },
      });
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(String(e));
    }
  }, [settings.gmailClientId]);

  useEffect(() => { initClient(); }, [initClient]);

  const connect = (interactive = true) => {
    if (!tokenClientRef.current) return;
    tokenClientRef.current.requestAccessToken({ prompt: interactive ? "consent" : "" });
  };

  // Try a silent (no-popup) reconnect on load if the user connected before.
  useEffect(() => {
    if (status === "ready" && loadLocal("voarcade:gmailWasConnected", false)) {
      connect(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const sendEmail = async (to, subject, body) => {
    if (!accessTokenRef.current) throw new Error("Not connected to Gmail yet.");
    const message = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`;
    const raw = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessTokenRef.current}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gmail API error ${res.status}: ${t}`);
    }
    return true;
  };

  return { status, error, connect, sendEmail, hasToken: () => !!accessTokenRef.current };
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
function VoarcadeConsole() {
  const [tab, setTab] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState({
    gmailClientId: "",
    reminderEmail: "",
    senderLabel: "The VO Arcade",
    autoSend: true,
  });
  const [sentLog, setSentLog] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [autoSendNote, setAutoSendNote] = useState("");
  const [installEvt, setInstallEvt] = useState(null);

  useEffect(() => {
    setClients(loadLocal(KEYS.clients, []));
    setReferrers(loadLocal(KEYS.referrers, []));
    setInvoices(loadLocal(KEYS.invoices, []));
    setSettings((s) => ({ ...s, ...loadLocal(KEYS.settings, {}) }));
    setSentLog(loadLocal(KEYS.sentLog, {}));
    setLoaded(true);
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const saveClients = (next) => { setClients(next); saveLocal(KEYS.clients, next); };
  const saveReferrers = (next) => { setReferrers(next); saveLocal(KEYS.referrers, next); };
  const saveInvoices = (next) => { setInvoices(next); saveLocal(KEYS.invoices, next); };
  const saveSettings = (next) => { setSettings(next); saveLocal(KEYS.settings, next); };
  const markSent = (key) => { const next = { ...sentLog, [key]: todayStr() }; setSentLog(next); saveLocal(KEYS.sentLog, next); };

  const invoiceStatus = (inv) => {
    if (inv.status === "paid") return "paid";
    const d = daysUntil(inv.dueDate);
    if (d === null) return "open";
    if (d < 0) return "overdue";
    if (d <= 7) return "soon";
    return "open";
  };

  const clientName = (id) => clients.find((c) => c.id === id)?.name || "\u2014";
  const overdueCount = invoices.filter((i) => invoiceStatus(i) === "overdue").length;
  const soonCount = invoices.filter((i) => invoiceStatus(i) === "soon").length;
  const owed = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
  const dueRemindersToday = invoices.filter((i) => i.status !== "paid" && i.reminderDate && daysUntil(i.reminderDate) <= 0);

  const gmail = useGmail(settings);

  // ---- Fully-automatic reminder check --------------------
  // Runs whenever the app is opened (and whenever the data or
  // Gmail connection changes). Sends one email per invoice per
  // day at most, tracked in sentLog so nothing is duplicated.
  useEffect(() => {
    if (!loaded || !settings.autoSend || !settings.reminderEmail) return;
    if (gmail.status !== "connected" || !gmail.hasToken()) return;

    const pending = dueRemindersToday.filter((inv) => sentLog[inv.id] !== todayStr());
    if (pending.length === 0) return;

    (async () => {
      let sent = 0;
      for (const inv of pending) {
        const d = daysUntil(inv.dueDate);
        const dueLine = inv.dueDate
          ? (d < 0 ? `${Math.abs(d)} day(s) overdue (was due ${inv.dueDate})` : `due ${inv.dueDate}`)
          : "no due date set";
        const subject = `[VO Arcade] Invoice reminder — ${clientName(inv.clientId)} — ${fmtMoney(inv.amount)}`;
        const body =
`Reminder from ${settings.senderLabel || "The VO Arcade"}:

Client: ${clientName(inv.clientId)}
Job: ${inv.description || "Invoice"}
Amount: ${fmtMoney(inv.amount)}
Status: ${dueLine}
${inv.notes ? `Notes: ${inv.notes}\n` : ""}
This reminder was sent automatically by the VO Arcade console.`;
        try {
          await gmail.sendEmail(settings.reminderEmail, subject, body);
          markSent(inv.id);
          sent++;
        } catch (e) {
          console.error("Reminder send failed", e);
        }
      }
      if (sent > 0) setAutoSendNote(`Sent ${sent} reminder email${sent > 1 ? "s" : ""} to ${settings.reminderEmail} just now.`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, gmail.status, settings.autoSend, settings.reminderEmail, invoices]);

  if (!loaded) {
    return <div style={{ background: C.ink, color: C.dim, padding: 40, textAlign: "center", fontFamily: "system-ui" }}>Tuning up the console\u2026</div>;
  }

  return (
    <div style={{ background: C.ink, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "sticky", top: 0, background: C.ink, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="icons/icon-192.png" alt="" style={{ width: 34, height: 34, borderRadius: 8 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1.5, color: C.brass }}>THE VO ARCADE</div>
            <div style={{ fontSize: 11, color: C.dim, letterSpacing: 0.8, textTransform: "uppercase" }}>Client &amp; Invoice Console</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {installEvt && (
            <Btn variant="brass" onClick={async () => { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); }}>
              <Icons.Download size={13} /> Install app
            </Btn>
          )}
          <VUMeter level={Math.min(1, 0.3 + owed / 2000)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "12px 20px 0", flexWrap: "wrap" }}>
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "clients", label: "Clients", icon: Icons.Users },
          { id: "referrers", label: "Referrers", icon: Icons.Percent },
          { id: "invoices", label: "Invoices", icon: Icons.Receipt },
          { id: "settings", label: "Settings", icon: Icons.Settings },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? C.panel2 : "transparent", color: tab === t.id ? C.text : C.dim,
            border: `1px solid ${tab === t.id ? C.brass : "transparent"}`, borderBottom: "none",
            borderRadius: "8px 8px 0 0", padding: "8px 16px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.icon ? <t.icon size={14} /> : null}{t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
        {autoSendNote && (
          <Panel style={{ padding: "10px 14px", marginBottom: 14, borderColor: C.teal, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: C.teal, display: "flex", alignItems: "center", gap: 6 }}><Icons.Bolt size={13} color={C.teal} />{autoSendNote}</span>
            <button onClick={() => setAutoSendNote("")} style={{ background: "none", border: "none", cursor: "pointer" }}><Icons.X size={13} color={C.dim} /></button>
          </Panel>
        )}

        {tab === "dashboard" && (
          <DashboardTab overdueCount={overdueCount} soonCount={soonCount} owed={owed}
            reminders={dueRemindersToday} clients={clients} invoiceStatus={invoiceStatus}
            goInvoices={() => setTab("invoices")} clientName={clientName}
            gmailStatus={gmail.status} autoSend={settings.autoSend} reminderEmail={settings.reminderEmail} />
        )}
        {tab === "clients" && <ClientsTab clients={clients} saveClients={saveClients} query={query} setQuery={setQuery} />}
        {tab === "referrers" && <ReferrersTab referrers={referrers} saveReferrers={saveReferrers} />}
        {tab === "invoices" && <InvoicesTab invoices={invoices} saveInvoices={saveInvoices} clients={clients} referrers={referrers} invoiceStatus={invoiceStatus} />}
        {tab === "settings" && (
          <SettingsTab settings={settings} saveSettings={saveSettings} gmail={gmail}
            pendingCount={dueRemindersToday.length} />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   DASHBOARD
--------------------------------------------------------- */
function DashboardTab({ overdueCount, soonCount, owed, reminders, clientName, invoiceStatus, goInvoices, gmailStatus, autoSend, reminderEmail }) {
  const stats = [
    { label: "Overdue", value: overdueCount, color: C.red },
    { label: "Due within 7 days", value: soonCount, color: C.amber },
    { label: "Outstanding", value: fmtMoney(owed), color: C.brass },
  ];
  return (
    <div>
      <SectionHeader title="Console overview" subtitle="Where the money's at, right now." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
        {stats.map((s) => (
          <Panel key={s.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
          </Panel>
        ))}
      </div>

      <Panel style={{ padding: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: gmailStatus === "connected" ? C.teal : C.dim, boxShadow: gmailStatus === "connected" ? `0 0 6px ${C.teal}` : "none" }} />
        <span style={{ fontSize: 12.5, color: C.dim }}>
          {!reminderEmail ? "Set a reminder email in Settings to enable automatic emails." :
            gmailStatus === "connected" ? `Gmail connected \u2014 reminders send automatically to ${reminderEmail}.` :
            "Gmail not connected yet \u2014 head to Settings to connect."}
          {reminderEmail && !autoSend && " (auto-send is switched off)"}
        </span>
      </Panel>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <Icons.Alert size={14} color={C.amber} /> Reminders due
      </div>
      {reminders.length === 0 && <div style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>Nothing to chase today.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
        {reminders.map((r) => (
          <Panel key={r.id} style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div onClick={goInvoices}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{clientName(r.clientId)}</div>
              <div style={{ fontSize: 12, color: C.dim }}>{r.description || "Invoice"} \u00B7 {fmtMoney(r.amount)}</div>
            </div>
            <StatusLight status={invoiceStatus(r)} />
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CLIENTS
--------------------------------------------------------- */
function ClientsTab({ clients, saveClients, query, setQuery }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const startNew = () => { setForm({ id: uid(), name: "", email: "", phone: "", notes: "" }); setEditing("new"); };
  const startEdit = (c) => { setForm({ ...c }); setEditing(c.id); };
  const cancel = () => { setForm(null); setEditing(null); };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing === "new") saveClients([...clients, form]);
    else saveClients(clients.map((c) => (c.id === form.id ? form : c)));
    cancel();
  };
  const del = (id) => { saveClients(clients.filter((c) => c.id !== id)); setConfirmDel(null); };
  const filtered = clients.filter((c) => (c.name + c.email + c.phone).toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Clients" subtitle={`${clients.length} on file`} action={<Btn variant="brass" onClick={startNew}><Icons.Plus size={14} />Add client</Btn>} />
      <div style={{ position: "relative", marginBottom: 14, maxWidth: 280 }}>
        <Icons.Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.dim }} />
        <Input placeholder="Search clients\u2026" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 30, width: "100%" }} />
      </div>
      {editing && (
        <Panel style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client name" /></Field>
            <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+353\u2026" /></Field>
          </div>
          <Field label="Notes"><TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Project type, preferences, anything worth remembering" /></Field>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn variant="teal" onClick={save}><Icons.Check size={14} />Save</Btn>
            <Btn onClick={cancel}><Icons.X size={14} />Cancel</Btn>
          </div>
        </Panel>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((c) => (
          <Panel key={c.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
                  {c.email && <span style={{ fontSize: 12, color: C.dim, display: "flex", alignItems: "center", gap: 4 }}><Icons.Mail size={11} />{c.email}</span>}
                  {c.phone && <span style={{ fontSize: 12, color: C.dim, display: "flex", alignItems: "center", gap: 4 }}><Icons.Phone size={11} />{c.phone}</span>}
                </div>
                {c.notes && <div style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>{c.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn onClick={() => startEdit(c)}><Icons.Pencil size={13} /></Btn>
                {confirmDel === c.id ? <Btn variant="danger" onClick={() => del(c.id)}>Confirm</Btn> : <Btn variant="danger" onClick={() => setConfirmDel(c.id)}><Icons.Trash size={13} /></Btn>}
              </div>
            </div>
          </Panel>
        ))}
        {filtered.length === 0 && <div style={{ fontSize: 13, color: C.dim }}>No clients yet \u2014 add your first one above.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   REFERRERS
--------------------------------------------------------- */
function ReferrersTab({ referrers, saveReferrers }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const startNew = () => { setForm({ id: uid(), name: "", contact: "", feeType: "percent", feeValue: "", notes: "" }); setEditing("new"); };
  const startEdit = (r) => { setForm({ ...r }); setEditing(r.id); };
  const cancel = () => { setForm(null); setEditing(null); };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing === "new") saveReferrers([...referrers, form]);
    else saveReferrers(referrers.map((r) => (r.id === form.id ? form : r)));
    cancel();
  };
  const del = (id) => { saveReferrers(referrers.filter((r) => r.id !== id)); setConfirmDel(null); };

  return (
    <div>
      <SectionHeader title="Referrers & fees" subtitle={`${referrers.length} on file`} action={<Btn variant="brass" onClick={startNew}><Icons.Plus size={14} />Add referrer</Btn>} />
      {editing && (
        <Panel style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Referrer / agency" /></Field>
            <Field label="Contact"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Email or phone" /></Field>
            <Field label="Fee type">
              <Select value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })}>
                <option value="percent">% of invoice</option>
                <option value="flat">Flat fee</option>
              </Select>
            </Field>
            <Field label={form.feeType === "percent" ? "Default %" : "Default flat fee (\u20AC)"}>
              <Input type="number" value={form.feeValue} onChange={(e) => setForm({ ...form, feeValue: e.target.value })} placeholder={form.feeType === "percent" ? "10" : "50"} />
            </Field>
          </div>
          <Field label="Notes"><TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Terms, how they usually refer work" /></Field>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn variant="teal" onClick={save}><Icons.Check size={14} />Save</Btn>
            <Btn onClick={cancel}><Icons.X size={14} />Cancel</Btn>
          </div>
        </Panel>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {referrers.map((r) => (
          <Panel key={r.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{r.contact}</div>
                <div style={{ fontSize: 12, color: C.brass, marginTop: 4, fontWeight: 600 }}>{r.feeType === "percent" ? `${r.feeValue}% per invoice` : `${fmtMoney(r.feeValue)} flat per invoice`}</div>
                {r.notes && <div style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>{r.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn onClick={() => startEdit(r)}><Icons.Pencil size={13} /></Btn>
                {confirmDel === r.id ? <Btn variant="danger" onClick={() => del(r.id)}>Confirm</Btn> : <Btn variant="danger" onClick={() => setConfirmDel(r.id)}><Icons.Trash size={13} /></Btn>}
              </div>
            </div>
          </Panel>
        ))}
        {referrers.length === 0 && <div style={{ fontSize: 13, color: C.dim }}>No referrers yet \u2014 add one above.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   INVOICES
--------------------------------------------------------- */
function InvoicesTab({ invoices, saveInvoices, clients, referrers, invoiceStatus }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [filter, setFilter] = useState("all");

  const blank = () => ({ id: uid(), clientId: clients[0]?.id || "", referrerId: "", description: "", amount: "", issueDate: todayStr(), dueDate: "", reminderDate: "", status: "unpaid", notes: "" });
  const startNew = () => { setForm(blank()); setEditing("new"); };
  const startEdit = (inv) => { setForm({ ...inv }); setEditing(inv.id); };
  const cancel = () => { setForm(null); setEditing(null); };
  const save = () => {
    if (!form.clientId || !form.amount) return;
    if (editing === "new") saveInvoices([...invoices, form]);
    else saveInvoices(invoices.map((i) => (i.id === form.id ? form : i)));
    cancel();
  };
  const del = (id) => { saveInvoices(invoices.filter((i) => i.id !== id)); setConfirmDel(null); };
  const togglePaid = (inv) => saveInvoices(invoices.map((i) => (i.id === inv.id ? { ...i, status: i.status === "paid" ? "unpaid" : "paid" } : i)));

  const clientName = (id) => clients.find((c) => c.id === id)?.name || "\u2014";
  const referrerName = (id) => referrers.find((r) => r.id === id)?.name;
  const visible = invoices.filter((i) => (filter === "all" ? true : invoiceStatus(i) === filter)).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return (
    <div>
      <SectionHeader title="Invoices & reminders" subtitle={`${invoices.length} total`} action={<Btn variant="brass" onClick={startNew}><Icons.Plus size={14} />Add invoice</Btn>} />
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", "overdue", "soon", "open", "paid"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.panel2 : "transparent", border: `1px solid ${filter === f ? C.brass : C.line}`, color: filter === f ? C.text : C.dim, borderRadius: 999, padding: "5px 12px", fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
        ))}
      </div>
      {clients.length === 0 && !editing && <div style={{ fontSize: 13, color: C.dim, marginBottom: 14 }}>Add a client first before creating an invoice.</div>}
      {editing && (
        <Panel style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Field label="Client">
              <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Referrer (optional)">
              <Select value={form.referrerId} onChange={(e) => setForm({ ...form, referrerId: e.target.value })}>
                <option value="">None</option>
                {referrers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <Field label="Job description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Corporate explainer VO" /></Field>
            <Field label="Amount (\u20AC)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="250" /></Field>
            <Field label="Issue date"><Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></Field>
            <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
            <Field label="Reminder date" hint="An email fires automatically once this date arrives."><Input type="date" value={form.reminderDate} onChange={(e) => setForm({ ...form, reminderDate: e.target.value })} /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes"><TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Invoice number, payment terms, etc." /></Field>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn variant="teal" onClick={save}><Icons.Check size={14} />Save</Btn>
            <Btn onClick={cancel}><Icons.X size={14} />Cancel</Btn>
          </div>
        </Panel>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((inv) => {
          const st = invoiceStatus(inv);
          const d = daysUntil(inv.dueDate);
          return (
            <Panel key={inv.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{clientName(inv.clientId)}</div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                    {inv.description || "Invoice"} \u00B7 {fmtMoney(inv.amount)}
                    {referrerName(inv.referrerId) && ` \u00B7 via ${referrerName(inv.referrerId)}`}
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <Icons.Clock size={11} />
                    {inv.dueDate ? `Due ${inv.dueDate}${d !== null ? ` (${d >= 0 ? `${d}d left` : `${Math.abs(d)}d overdue`})` : ""}` : "No due date"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <StatusLight status={st} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn onClick={() => togglePaid(inv)}>{inv.status === "paid" ? "Mark unpaid" : "Mark paid"}</Btn>
                    <Btn onClick={() => startEdit(inv)}><Icons.Pencil size={13} /></Btn>
                    {confirmDel === inv.id ? <Btn variant="danger" onClick={() => del(inv.id)}>Confirm</Btn> : <Btn variant="danger" onClick={() => setConfirmDel(inv.id)}><Icons.Trash size={13} /></Btn>}
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
        {visible.length === 0 && <div style={{ fontSize: 13, color: C.dim }}>Nothing here.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   SETTINGS — Gmail connection + automatic reminder config
--------------------------------------------------------- */
function SettingsTab({ settings, saveSettings, gmail, pendingCount }) {
  const [form, setForm] = useState(settings);
  const [testMsg, setTestMsg] = useState("");
  useEffect(() => setForm(settings), [settings]);

  const update = (patch) => setForm({ ...form, ...patch });
  const save = () => saveSettings(form);

  const sendTest = async () => {
    setTestMsg("Sending\u2026");
    try {
      await gmail.sendEmail(form.reminderEmail, "[VO Arcade] Test reminder", "This is a test email from your VO Arcade console. If you got this, automatic reminders are wired up correctly.");
      setTestMsg("Test email sent \u2014 check your inbox.");
    } catch (e) {
      setTestMsg(`Failed: ${e.message}`);
    }
  };

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Connect Gmail so invoice reminders send themselves." />

      <Panel style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>1. Google Cloud OAuth Client ID</div>
        <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 10, lineHeight: 1.5 }}>
          Gmail requires you to bring your own OAuth Client ID (it's free, takes about five minutes, and only you can use it). Full steps are in <b>README.md</b> in this app's folder. Paste the Client ID below once you have it.
        </div>
        <Field label="OAuth Client ID">
          <Input value={form.gmailClientId} onChange={(e) => update({ gmailClientId: e.target.value })} placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com" />
        </Field>
      </Panel>

      <Panel style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>2. Where reminders get sent</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Reminder email (your professional inbox)">
            <Input value={form.reminderEmail} onChange={(e) => update({ reminderEmail: e.target.value })} placeholder="shaun@voarcade.com" />
          </Field>
          <Field label="Sender label">
            <Input value={form.senderLabel} onChange={(e) => update({ senderLabel: e.target.value })} placeholder="The VO Arcade" />
          </Field>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: C.dim }}>
          <input type="checkbox" checked={!!form.autoSend} onChange={(e) => update({ autoSend: e.target.checked })} />
          Automatically email reminders whenever this app is open (no button needed)
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Btn variant="teal" onClick={save}><Icons.Check size={14} />Save settings</Btn>
        </div>
      </Panel>

      <Panel style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>3. Connect your Gmail account</div>
        <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 12 }}>
          Status: <b style={{ color: gmail.status === "connected" ? C.teal : C.dim }}>
            {gmail.status === "connected" ? "Connected" : gmail.status === "ready" ? "Not connected yet" : gmail.status === "error" ? "Error" : "Waiting for Client ID"}
          </b>
          {gmail.error && <span style={{ color: C.red }}> \u2014 {gmail.error}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Btn variant="brass" disabled={!form.gmailClientId || gmail.status === "idle"} onClick={() => gmail.connect(true)}>
            <Icons.Mail size={14} /> {gmail.status === "connected" ? "Reconnect" : "Connect Gmail"}
          </Btn>
          <Btn disabled={gmail.status !== "connected" || !form.reminderEmail} onClick={sendTest}>
            <Icons.Send size={14} /> Send test email
          </Btn>
        </div>
        {testMsg && <div style={{ fontSize: 12.5, color: C.dim, marginTop: 10 }}>{testMsg}</div>}
      </Panel>

      <Panel style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>How the automation works</div>
        <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.6 }}>
          Every invoice has a <b>reminder date</b>. Whenever the app is open (desktop or mobile) and Gmail is
          connected, it checks for reminders that are due today or overdue ({pendingCount} pending right now)
          and emails you automatically \u2014 no button-pressing needed. Each reminder only sends once per day, so
          reopening the app won't spam your inbox. Because this runs in the app itself, reminders go out whenever
          you open it \u2014 they won't fire while your laptop is fully closed and the app isn't running. Leaving a
          tab or the installed app open (or opening it once a day) keeps things fully automatic.
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------
   MOUNT
--------------------------------------------------------- */
ReactDOM.createRoot(document.getElementById("root")).render(<VoarcadeConsole />);
