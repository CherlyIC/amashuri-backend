import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@amashuri.rw' },
  });

  if (existingAdmin) {
    console.log('Admin already exists!');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@2026', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Amashuri Admin',
      email: 'admin@amashuri.rw',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Admin created successfully!');
  console.log('Email:', admin.email);
  console.log('Password: Admin@2026');
  console.log('Role:', admin.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });