#!/usr/bin/env node
const path = require('path');
const { prisma } = require(path.resolve(__dirname, '../src/shared/prisma'));

async function main() {
  const guides = await prisma.guide.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`Total guides: ${guides.length}`);
  for (const g of guides.slice(0, 30)) {
    console.log({ id: g.id, userId: g.userId, displayName: g.displayName, email: g.user?.email || null, createdAt: g.createdAt });
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Failed to list guides:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
