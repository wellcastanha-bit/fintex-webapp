// app/api/caixa-diario/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const COMPANY_ID = "default";

// ✅ DIA OPERACIONAL = 06:00 local (Brasil -03)
// No banco em UTC isso equivale a 09:00Z
const OP_CUTOFF_HOUR = 6;
const TZ_OFFSET_MIN = -180;

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

function requireEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
}

function getSupabase() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = requireEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function checkApiKey(req: Request) {
  const expected = process.env.FIN_TEX_API_KEY;
  if (!expected) return true;
  const got = req.headers.get("x-fintex-key");
  return !!got && got === expected;
}

function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function addDaysISO(dateISO: string, days: number) {
  const [yy, mm, dd] = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(yy, (mm || 1) - 1, dd || 1, 12, 0, 0));
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/**
 * local = UTC + offset
 * UTC = local - offset
 */
function localDateTimeToUTCISO(
  dateISO: string,
  hour: number,
  minute = 0,
  second = 0,
  ms = 0
) {
  const [yy, mm, dd] = dateISO.split("-").map(Number);
  const localMs = Date.UTC(yy, (mm || 1) - 1, dd || 1, hour, minute, second, ms);
  const utcMs = localMs - TZ_OFFSET_MIN * 60 * 1000;
  return new Date(utcMs).toISOString();
}

/**
 * ✅ Resolve op_date pelo horário local do Brasil (-03) com virada às 06:00
 */
function getOperationalDateFromUTCISOString(utcIso: string) {
  const utcMs = new Date(utcIso).getTime();
  if (!Number.isFinite(utcMs)) throw new Error("invalid occurred_at");

  const localMs = utcMs + TZ_OFFSET_MIN * 60 * 1000;
  const d = new Date(localMs);

  let opDate = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

  if (d.getUTCHours() < OP_CUTOFF_HOUR) {
    opDate = addDaysISO(opDate, -1);
  }

  return opDate;
}

/**
 * ✅ Range UTC do dia operacional ancorado em op_date local
 * start = op_date 06:00 local
 * end   = op_date+1 06:00 local
 */
function operationalRangeUTCFromDate(opDate: string) {
  const startISO = localDateTimeToUTCISO(opDate, OP_CUTOFF_HOUR, 0, 0, 0);
  const endISO = localDateTimeToUTCISO(addDaysISO(opDate, 1), OP_CUTOFF_HOUR, 0, 0, 0);
  return { startISO, endISO };
}

async function ensureSession(supabase: any, op_date: string) {
  const { data: existing, error: selErr } = await supabase
    .from("cash_sessions")
    .select("id, op_date, initial_counts, final_counts, created_at, updated_at")
    .eq("company_id", COMPANY_ID)
    .eq("op_date", op_date)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing;

  const { data: created, error: insErr } = await supabase
    .from("cash_sessions")
    .insert({
      company_id: COMPANY_ID,
      op_date,
      initial_counts: [],
      final_counts: [],
    })
    .select("id, op_date, initial_counts, final_counts, created_at, updated_at")
    .single();

  if (insErr) throw insErr;
  return created;
}

/* =========================
   GET
========================= */
export async function GET(req: Request) {
  try {
    if (!checkApiKey(req)) return json(false, { error: "unauthorized" }, 401);

    const url = new URL(req.url);
    const date = (url.searchParams.get("date") || "").trim();

    if (!date || !isISODate(date)) {
      return json(false, { error: 'missing/invalid "date" (YYYY-MM-DD)' }, 400);
    }

    const supabase = getSupabase();

    const session = await ensureSession(supabase, date);
    const { startISO, endISO } = operationalRangeUTCFromDate(date);

    const { data: entries, error: entErr } = await supabase
      .from("cash_entries")
      .select("id, op_date, type, category, description, amount, occurred_at, created_at")
      .eq("company_id", COMPANY_ID)
      .gte("occurred_at", startISO)
      .lt("occurred_at", endISO)
      .order("occurred_at", { ascending: false });

    if (entErr) throw entErr;

    return json(true, {
      session,
      entries: entries || [],
      op: {
        op_date: date,
        startISO,
        endISO,
        cutoff_hour_local: OP_CUTOFF_HOUR,
      },
    });
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}

/* =========================
   POST
========================= */
export async function POST(req: Request) {
  try {
    if (!checkApiKey(req)) return json(false, { error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const dateISOInput = String(body?.dateISO || "").trim();
    const type = String(body?.type || "").trim().toLowerCase();

    const category = body?.category == null ? null : String(body.category).trim() || null;
    const description = String(body?.description || "").trim();
    const amountRaw = body?.amount;

    if (!["manual_in", "expense", "withdrawal"].includes(type)) {
      return json(false, { error: 'invalid "type"' }, 400);
    }

    const amount = Number(typeof amountRaw === "string" ? amountRaw.replace(",", ".") : amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json(false, { error: 'invalid "amount"' }, 400);
    }

    const supabase = getSupabase();

    const occurred_at =
      body?.occurred_at && String(body.occurred_at).trim()
        ? String(body.occurred_at).trim()
        : new Date().toISOString();

    const resolvedOpDate = dateISOInput && isISODate(dateISOInput)
      ? dateISOInput
      : getOperationalDateFromUTCISOString(occurred_at);

    await ensureSession(supabase, resolvedOpDate);

    const { data, error } = await supabase
      .from("cash_entries")
      .insert({
        company_id: COMPANY_ID,
        op_date: resolvedOpDate,
        type,
        category,
        description,
        amount,
        occurred_at,
      })
      .select("id, op_date, type, category, description, amount, occurred_at, created_at")
      .single();

    if (error) throw error;

    return json(true, {
      entry: data,
      op: {
        resolved_op_date: resolvedOpDate,
        occurred_at,
        cutoff_hour_local: OP_CUTOFF_HOUR,
      },
    });
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}

/* =========================
   PATCH
========================= */
export async function PATCH(req: Request) {
  try {
    if (!checkApiKey(req)) return json(false, { error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const dateISO = String(body?.dateISO || "").trim();

    if (!dateISO || !isISODate(dateISO)) {
      return json(false, { error: 'missing/invalid "dateISO"' }, 400);
    }

    const initial_counts = body?.initial_counts;
    const final_counts = body?.final_counts;

    if (initial_counts == null && final_counts == null) {
      return json(false, { error: "nothing_to_update" }, 400);
    }

    const supabase = getSupabase();

    await ensureSession(supabase, dateISO);

    const patch: any = {};
    if (initial_counts != null) patch.initial_counts = initial_counts;
    if (final_counts != null) patch.final_counts = final_counts;

    const { data, error } = await supabase
      .from("cash_sessions")
      .update(patch)
      .eq("company_id", COMPANY_ID)
      .eq("op_date", dateISO)
      .select("id, op_date, initial_counts, final_counts, created_at, updated_at")
      .single();

    if (error) throw error;

    return json(true, {
      session: data,
      op: {
        op_date: dateISO,
        cutoff_hour_local: OP_CUTOFF_HOUR,
      },
    });
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}