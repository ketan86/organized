/**
 * HTTP API smoke tests against running dev server (no AI).
 * Run: npx tsx scripts/test-api-http.ts
 * Requires: npm run dev on :8080
 */
const BASE = "http://localhost:8080";

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [];

function check(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "✓" : "✗"} ${name}: ${detail}`);
}

function parseCookies(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  console.log("\n═══ HTTP API smoke (no AI) ═══\n");

  const unauth = await fetch(`${BASE}/api/bootstrap`);
  check(
    "bootstrap requires auth",
    unauth.status === 401,
    `status ${unauth.status}`,
  );

  const email = `journey-http-${Date.now()}@test.local`;
  const password = "testpassword12345";

  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  check("register", reg.ok, `status ${reg.status}`);
  const cookie = parseCookies(reg);

  const me = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  const meBody = (await me.json()) as { user: { email: string } | null };
  check("session cookie works", meBody.user?.email === email, email);

  const bootstrapRes = await fetch(`${BASE}/api/bootstrap`, {
    headers: { Cookie: cookie },
  });
  check("bootstrap loads", bootstrapRes.ok, `status ${bootstrapRes.status}`);

  const createRes = await fetch(`${BASE}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      areaId: "personal",
      title: "[HTTP-TEST] walk the dog",
      estimateMinutes: 30,
      scheduledDate: new Date().toISOString().slice(0, 10),
      recurrence: "none",
      reminder: "none",
    }),
  });
  const created = (await createRes.json()) as { task: { id: string } };
  check("create task", createRes.status === 201, created.task?.id ?? "fail");

  const patchRes = await fetch(`${BASE}/api/tasks/${created.task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ scheduledDate: null }),
  });
  check("reschedule to backlog", patchRes.ok, `status ${patchRes.status}`);

  const completeRes = await fetch(`${BASE}/api/tasks/${created.task.id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({}),
  });
  check("complete task", completeRes.ok, `status ${completeRes.status}`);

  const deleteRes = await fetch(`${BASE}/api/tasks/${created.task.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  check("delete task", deleteRes.ok, `status ${deleteRes.status}`);

  const sessionStart = await fetch(`${BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      targetType: "area",
      targetId: "personal",
      areaId: "personal",
    }),
  });
  check("start tracking", sessionStart.ok, `status ${sessionStart.status}`);

  const sessionStop = await fetch(`${BASE}/api/sessions/stop`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  check("stop tracking", sessionStop.ok, `status ${sessionStop.status}`);

  const profilePatch = await fetch(`${BASE}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ timeWindow: "week" }),
  });
  check("patch time window", profilePatch.ok, `status ${profilePatch.status}`);

  const aiStatus = await fetch(`${BASE}/api/ai/status`, {
    headers: { Cookie: cookie },
  });
  check(
    "ai status with session",
    aiStatus.ok,
    `status ${aiStatus.status}`,
  );

  const passed = checks.filter((c) => c.pass).length;
  console.log(`\n═══ ${passed}/${checks.length} passed ═══\n`);
  if (passed < checks.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
