#!/usr/bin/env node
/*
  Script: upsert_missing_guides.js
  Purpose: For every User with role='guide' but without a Guide record, create a Guide record.
  Usage: node scripts/upsert_missing_guides.js
*/

const path = require('path');
const { prisma } = require(path.resolve(__dirname, '../src/shared/prisma'));

async function main() {
  console.log('Searching for users with role=guide but missing Guide profile...');

  // Count users who are guides but don't have a guide record
  const missing = await prisma.user.findMany({
    where: {
      role: 'guide',
      guide: { is: null },
    },
    select: { id: true, email: true, name: true },
  });

  console.log(`Found ${missing.length} users without Guide profile`);

  if (missing.length === 0) {
    await prisma.$disconnect();
    return;
  }

  const created = [];
  for (const u of missing) {
    try {
      const g = await prisma.guide.create({
        data: {
          userId: u.id,
          displayName: u.name || u.email || null,
        },
      });
      created.push(g.id);
      console.log(`Created guide for user ${u.id} -> guide id ${g.id}`);
    } catch (err) {
      console.error(`Failed to create guide for user ${u.id}:`, err.message || err);
    }
  }

  console.log(`Created ${created.length} guide profiles.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Script failed:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
