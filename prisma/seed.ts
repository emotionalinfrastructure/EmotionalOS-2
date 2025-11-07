import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const db = new PrismaClient();

function sha256(obj: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

async function main() {
  const user = await db.user.upsert({
    where: { email: "local@emotional.os" },
    update: {},
    create: { email: "local@emotional.os", displayName: "Local User" },
  });

  await db.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, privacyMode: true, dataRetentionDays: 365 },
  });

  const session = await db.sessionLog.create({
    data: {
      userId: user.id,
      startedAt: new Date(Date.now() - 40 * 60 * 1000),
      endedAt: new Date(),
      durationSec: 40 * 60,
      note: "Demo session",
    },
  });

  const s1 = await db.emotionalState.create({
    data: {
      userId: user.id,
      sessionId: session.id,
      intensity: 62,
      valence: -20,
      arousal: 70,
      tags: JSON.stringify(["demo","baseline"]),
    },
  });
  const s2 = await db.emotionalState.create({
    data: {
      userId: user.id,
      sessionId: session.id,
      intensity: 48,
      valence: 10,
      arousal: 45,
      tags: JSON.stringify(["breathing","recovery"]),
    },
  });

  const n1 = await db.nssiEvent.create({
    data: {
      userId: user.id,
      severity: 2,
      triggerType: "digital",
      intervention: "box-breathing",
      notes: "Doomscrolling spike; recovered with breath.",
    },
  });

  let lastHash: string | null = null;
  const records = [
    { kind: "session", payload: { id: session.id, note: session.note } },
    { kind: "state",   payload: { id: s1.id, v: s1.valence, a: s1.arousal } },
    { kind: "state",   payload: { id: s2.id, v: s2.valence, a: s2.arousal } },
    { kind: "nssi",    payload: { id: n1.id, severity: n1.severity } }
  ];

  let chainIndex = 0;
  for (const r of records) {
    const body = { userId: user.id, ...r, prevHash: lastHash, chainIndex };
    const h = sha256(body);
    await db.vaultEntry.create({
      data: {
        userId: user.id,
        kind: r.kind,
        payload: JSON.stringify(r.payload),
        prevHash: lastHash ?? undefined,
        chainIndex,
        sha256: h,
      },
    });
    lastHash = h;
    chainIndex += 1;
  }

  await db.analyticsPattern.create({
    data: {
      userId: user.id,
      name: "evening-spike",
      description: "Higher arousal after 8pm; recommend wind-down routine.",
      params: JSON.stringify({ hourFrom: 20, hourTo: 23, arousalAvg: 65 }),
    },
  });

  console.log("✅ Seeded database with demo data");
}

main()
  .then(async () => { await db.$disconnect(); })
  .catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
