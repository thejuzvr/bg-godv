#!/usr/bin/env ts-node
import { db } from "../server/storage";
import * as schema from "../shared/schema";

async function main() {
  const presets = [
    { id: 'prof-warrior', code: 'warrior', name: 'Warrior', baseMultipliers: { combat: 1.15, training: 1.05, magic: 0.85 } },
    { id: 'prof-mage', code: 'mage', name: 'Mage', baseMultipliers: { magic: 1.2, artifacts: 1.1, combat: 0.9 } },
    { id: 'prof-thief', code: 'thief', name: 'Thief', baseMultipliers: { stealth: 1.2, thievery: 1.15, combat: 0.9 } },
  ];
  for (const p of presets) {
    await db.insert(schema.aiProfiles)
      .values({ id: p.id, code: p.code, name: p.name, baseMultipliers: p.baseMultipliers as any })
      .onConflictDoNothing({ target: schema.aiProfiles.id });
  }
  console.log('Seeded AI profiles');
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });


