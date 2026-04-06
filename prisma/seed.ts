import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@amashuri.rw' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@2026', 10);
    await prisma.user.create({
      data: {
        name: 'Amashuri Admin',
        email: 'admin@amashuri.rw',
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log('Admin created successfully!');
  } else {
    console.log('Admin already exists!');
  }

  // ─── SCHOOLS ─────────────────────────────────────────────────────────────
  const schools = [
    {
      name: 'Groupe Scolaire Officiel de Butare',
      district: 'Huye',
      province: 'Southern',
      schoolType: 'PUBLIC',
      genderPolicy: 'COED',
      boarding: true,
      email: 'gsob@edu.rw',
      phone: '+250788000001',
      latitude: -2.5967,
      longitude: 29.7397,
      description: 'One of the oldest and most prestigious public schools in Rwanda located in Huye district.',
      yearEstablished: 1929,
      totalStudents: 1200,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Lycee de Kigali',
      district: 'Gasabo',
      province: 'Kigali',
      schoolType: 'PUBLIC',
      genderPolicy: 'COED',
      boarding: false,
      email: 'lycee@edu.rw',
      phone: '+250788000002',
      latitude: -1.9441,
      longitude: 30.0619,
      description: 'A leading public day school in the heart of Kigali city offering quality education.',
      yearEstablished: 1952,
      totalStudents: 980,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Ecole Secondaire Sainte Famille',
      district: 'Nyarugenge',
      province: 'Kigali',
      schoolType: 'PRIVATE',
      genderPolicy: 'GIRLS_ONLY',
      boarding: true,
      email: 'saintefamille@edu.rw',
      phone: '+250788000003',
      latitude: -1.9558,
      longitude: 30.0588,
      description: 'A prestigious private girls boarding school run by the Catholic Church in Kigali.',
      yearEstablished: 1960,
      totalStudents: 650,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'College Saint Andre',
      district: 'Nyarugenge',
      province: 'Kigali',
      schoolType: 'PRIVATE',
      genderPolicy: 'BOYS_ONLY',
      boarding: true,
      email: 'standre@edu.rw',
      phone: '+250788000004',
      latitude: -1.9500,
      longitude: 30.0600,
      description: 'One of the best private boys boarding schools in Rwanda with excellent academic results.',
      yearEstablished: 1955,
      totalStudents: 800,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Ecole Secondaire de Nyamata',
      district: 'Bugesera',
      province: 'Eastern',
      schoolType: 'PUBLIC',
      genderPolicy: 'COED',
      boarding: true,
      email: 'nyamata@edu.rw',
      phone: '+250788000005',
      latitude: -2.1500,
      longitude: 30.0833,
      description: 'A public boarding school in Bugesera district serving students from Eastern Province.',
      yearEstablished: 1975,
      totalStudents: 750,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Groupe Scolaire Muramba',
      district: 'Musanze',
      province: 'Northern',
      schoolType: 'GOVERNMENT_AIDED',
      genderPolicy: 'COED',
      boarding: true,
      email: 'muramba@edu.rw',
      phone: '+250788000006',
      latitude: -1.5000,
      longitude: 29.6333,
      description: 'A government aided school in Musanze district close to the Virunga mountains.',
      yearEstablished: 1968,
      totalStudents: 600,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Ecole Secondaire Kibogora',
      district: 'Rusizi',
      province: 'Western',
      schoolType: 'PRIVATE',
      genderPolicy: 'COED',
      boarding: true,
      email: 'kibogora@edu.rw',
      phone: '+250788000007',
      latitude: -2.4833,
      longitude: 28.9167,
      description: 'A private boarding school in Western Province near Lake Kivu with beautiful scenery.',
      yearEstablished: 1972,
      totalStudents: 500,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Lycee Notre Dame de Citeaux',
      district: 'Kicukiro',
      province: 'Kigali',
      schoolType: 'PRIVATE',
      genderPolicy: 'GIRLS_ONLY',
      boarding: false,
      email: 'citeaux@edu.rw',
      phone: '+250788000008',
      latitude: -1.9833,
      longitude: 30.1000,
      description: 'A renowned private girls day school in Kicukiro district of Kigali.',
      yearEstablished: 1963,
      totalStudents: 700,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Groupe Scolaire Rwamagana',
      district: 'Rwamagana',
      province: 'Eastern',
      schoolType: 'PUBLIC',
      genderPolicy: 'COED',
      boarding: true,
      email: 'rwamagana@edu.rw',
      phone: '+250788000009',
      latitude: -1.9500,
      longitude: 30.4333,
      description: 'A public boarding school serving students from Eastern Province with strong science programs.',
      yearEstablished: 1970,
      totalStudents: 850,
      status: 'VERIFIED',
      isVerified: true,
    },
    {
      name: 'Ecole Secondaire Byimana',
      district: 'Ruhango',
      province: 'Southern',
      schoolType: 'PUBLIC',
      genderPolicy: 'COED',
      boarding: true,
      email: 'byimana@edu.rw',
      phone: '+250788000010',
      latitude: -2.2167,
      longitude: 29.7833,
      description: 'A well known public boarding school in Southern Province with excellent academic performance.',
      yearEstablished: 1965,
      totalStudents: 900,
      status: 'VERIFIED',
      isVerified: true,
    },
  ];

  console.log('Creating schools...');

  for (const schoolData of schools) {
    const existing = await prisma.school.findFirst({
      where: { name: schoolData.name },
    });

    if (!existing) {
      const school = await prisma.school.create({
        data: schoolData as any,
      });

      // Add combinations
      const combinations = [
        { name: 'PCM', subjects: 'Physics, Chemistry, Mathematics' },
        { name: 'MCB', subjects: 'Mathematics, Chemistry, Biology' },
        { name: 'HEG', subjects: 'History, Economics, Geography' },
      ];

      for (const combo of combinations) {
        await prisma.combination.create({
          data: { schoolId: school.id, ...combo },
        });
      }

      // Add resources
      await prisma.schoolResource.create({
        data: {
          schoolId: school.id,
          laboratory: true,
          library: true,
          computerRoom: Math.random() > 0.3,
          sportsField: true,
          boardingHouse: schoolData.boarding,
          chapel: Math.random() > 0.5,
        },
      });

      // Add fees
      await prisma.fee.createMany({
        data: [
          {
            schoolId: school.id,
            level: 'S1',
            studentType: 'DAY',
            amount: Math.floor(Math.random() * 200000) + 100000,
            academicYear: '2025-2026',
          },
          {
            schoolId: school.id,
            level: 'S1',
            studentType: 'BOARDING',
            amount: Math.floor(Math.random() * 300000) + 200000,
            academicYear: '2025-2026',
          },
        ],
      });

      console.log(`Created school: ${school.name}`);
    } else {
      console.log(`School already exists: ${schoolData.name}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });