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
  // ─── KIGALI PROVINCE ───────────────────────────────────────────
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
    name: 'College Saint Andre',
    district: 'Nyarugenge',
    province: 'Kigali',
    schoolType: 'PRIVATE',
    genderPolicy: 'BOYS_ONLY',
    boarding: true,
    email: 'standre@edu.rw',
    phone: '+250788000003',
    latitude: -1.9500,
    longitude: 30.0600,
    description: 'One of the best private boys boarding schools in Rwanda with excellent academic results.',
    yearEstablished: 1955,
    totalStudents: 800,
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
    phone: '+250788000004',
    latitude: -1.9558,
    longitude: 30.0588,
    description: 'A prestigious private girls boarding school run by the Catholic Church in Kigali.',
    yearEstablished: 1960,
    totalStudents: 650,
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
    phone: '+250788000005',
    latitude: -1.9833,
    longitude: 30.1000,
    description: 'A renowned private girls day school in Kicukiro district of Kigali.',
    yearEstablished: 1963,
    totalStudents: 700,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Green Hills Academy',
    district: 'Gasabo',
    province: 'Kigali',
    schoolType: 'PRIVATE',
    genderPolicy: 'COED',
    boarding: false,
    email: 'greenhills@edu.rw',
    phone: '+250788000006',
    latitude: -1.9355,
    longitude: 30.0928,
    description: 'A leading international private school in Kigali offering Cambridge curriculum.',
    yearEstablished: 1994,
    totalStudents: 1100,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Riviera High School',
    district: 'Gasabo',
    province: 'Kigali',
    schoolType: 'PRIVATE',
    genderPolicy: 'COED',
    boarding: false,
    email: 'riviera@edu.rw',
    phone: '+250788000007',
    latitude: -1.9200,
    longitude: 30.1100,
    description: 'A well known private day school in Gasabo district offering quality secondary education.',
    yearEstablished: 2001,
    totalStudents: 850,
    status: 'VERIFIED',
    isVerified: true,
  },

  // ─── SOUTHERN PROVINCE ─────────────────────────────────────────
  {
    name: 'Ecole Secondaire Byimana',
    district: 'Ruhango',
    province: 'Southern',
    schoolType: 'PUBLIC',
    genderPolicy: 'COED',
    boarding: true,
    email: 'byimana@edu.rw',
    phone: '+250788000008',
    latitude: -2.2167,
    longitude: 29.7833,
    description: 'A well known public boarding school in Southern Province with excellent academic performance.',
    yearEstablished: 1965,
    totalStudents: 900,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Groupe Scolaire Mugombwa',
    district: 'Gisagara',
    province: 'Southern',
    schoolType: 'GOVERNMENT_AIDED',
    genderPolicy: 'COED',
    boarding: true,
    email: 'mugombwa@edu.rw',
    phone: '+250788000009',
    latitude: -2.6333,
    longitude: 29.8333,
    description: 'A government aided boarding school in Gisagara district serving Southern Province students.',
    yearEstablished: 1970,
    totalStudents: 750,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'College du Christ Roi Nyanza',
    district: 'Nyanza',
    province: 'Southern',
    schoolType: 'PRIVATE',
    genderPolicy: 'BOYS_ONLY',
    boarding: true,
    email: 'christroi@edu.rw',
    phone: '+250788000010',
    latitude: -2.3500,
    longitude: 29.7500,
    description: 'A prestigious private Catholic boys boarding school in Nyanza district.',
    yearEstablished: 1958,
    totalStudents: 600,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Ecole Secondaire de Ngoma Huye',
    district: 'Huye',
    province: 'Southern',
    schoolType: 'PUBLIC',
    genderPolicy: 'COED',
    boarding: false,
    email: 'ngoma@edu.rw',
    phone: '+250788000011',
    latitude: -2.6000,
    longitude: 29.7500,
    description: 'A public day school in Huye district close to the University of Rwanda.',
    yearEstablished: 1975,
    totalStudents: 550,
    status: 'VERIFIED',
    isVerified: true,
  },

  // ─── NORTHERN PROVINCE ─────────────────────────────────────────
  {
    name: 'Groupe Scolaire Muramba',
    district: 'Musanze',
    province: 'Northern',
    schoolType: 'GOVERNMENT_AIDED',
    genderPolicy: 'COED',
    boarding: true,
    email: 'muramba@edu.rw',
    phone: '+250788000012',
    latitude: -1.5000,
    longitude: 29.6333,
    description: 'A government aided school in Musanze district close to the Virunga mountains.',
    yearEstablished: 1968,
    totalStudents: 600,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Ecole Secondaire Shyira',
    district: 'Nyabihu',
    province: 'Northern',
    schoolType: 'PRIVATE',
    genderPolicy: 'COED',
    boarding: true,
    email: 'shyira@edu.rw',
    phone: '+250788000013',
    latitude: -1.6333,
    longitude: 29.5000,
    description: 'A private boarding school in Nyabihu district with beautiful mountain scenery.',
    yearEstablished: 1972,
    totalStudents: 500,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'College La Mennais Musanze',
    district: 'Musanze',
    province: 'Northern',
    schoolType: 'PRIVATE',
    genderPolicy: 'BOYS_ONLY',
    boarding: true,
    email: 'mennais@edu.rw',
    phone: '+250788000014',
    latitude: -1.4990,
    longitude: 29.6340,
    description: 'A prestigious private Catholic boys school in Musanze known for science excellence.',
    yearEstablished: 1960,
    totalStudents: 700,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Groupe Scolaire Butaro',
    district: 'Burera',
    province: 'Northern',
    schoolType: 'PUBLIC',
    genderPolicy: 'COED',
    boarding: true,
    email: 'butaro@edu.rw',
    phone: '+250788000015',
    latitude: -1.3833,
    longitude: 29.8333,
    description: 'A public boarding school in Burera district near the beautiful Lake Burera.',
    yearEstablished: 1978,
    totalStudents: 480,
    status: 'VERIFIED',
    isVerified: true,
  },

  // ─── EASTERN PROVINCE ──────────────────────────────────────────
  {
    name: 'Groupe Scolaire Rwamagana',
    district: 'Rwamagana',
    province: 'Eastern',
    schoolType: 'PUBLIC',
    genderPolicy: 'COED',
    boarding: true,
    email: 'rwamagana@edu.rw',
    phone: '+250788000016',
    latitude: -1.9500,
    longitude: 30.4333,
    description: 'A public boarding school serving students from Eastern Province with strong science programs.',
    yearEstablished: 1970,
    totalStudents: 850,
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
    phone: '+250788000017',
    latitude: -2.1500,
    longitude: 30.0833,
    description: 'A public boarding school in Bugesera district serving students from Eastern Province.',
    yearEstablished: 1975,
    totalStudents: 750,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'College Saint Joseph Nyagatare',
    district: 'Nyagatare',
    province: 'Eastern',
    schoolType: 'PRIVATE',
    genderPolicy: 'COED',
    boarding: true,
    email: 'stjoseph@edu.rw',
    phone: '+250788000018',
    latitude: -1.2996,
    longitude: 30.3247,
    description: 'A private Catholic boarding school in Nyagatare district of Eastern Province.',
    yearEstablished: 1980,
    totalStudents: 600,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Groupe Scolaire Kabarore',
    district: 'Gatsibo',
    province: 'Eastern',
    schoolType: 'GOVERNMENT_AIDED',
    genderPolicy: 'COED',
    boarding: true,
    email: 'kabarore@edu.rw',
    phone: '+250788000019',
    latitude: -1.5833,
    longitude: 30.4667,
    description: 'A government aided boarding school in Gatsibo district serving Eastern Province.',
    yearEstablished: 1973,
    totalStudents: 520,
    status: 'VERIFIED',
    isVerified: true,
  },

  // ─── WESTERN PROVINCE ──────────────────────────────────────────
  {
    name: 'Ecole Secondaire Kibogora',
    district: 'Rusizi',
    province: 'Western',
    schoolType: 'PRIVATE',
    genderPolicy: 'COED',
    boarding: true,
    email: 'kibogora@edu.rw',
    phone: '+250788000020',
    latitude: -2.4833,
    longitude: 28.9167,
    description: 'A private boarding school in Western Province near Lake Kivu with beautiful scenery.',
    yearEstablished: 1972,
    totalStudents: 500,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Groupe Scolaire Officiel Cyangugu',
    district: 'Rusizi',
    province: 'Western',
    schoolType: 'PUBLIC',
    genderPolicy: 'COED',
    boarding: true,
    email: 'cyangugu@edu.rw',
    phone: '+250788000021',
    latitude: -2.4900,
    longitude: 28.9100,
    description: 'A public boarding school in Rusizi district near the border with DRC.',
    yearEstablished: 1965,
    totalStudents: 700,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'College Adventiste de Gitwe',
    district: 'Ruhango',
    province: 'Southern',
    schoolType: 'PRIVATE',
    genderPolicy: 'COED',
    boarding: true,
    email: 'gitwe@edu.rw',
    phone: '+250788000022',
    latitude: -2.1667,
    longitude: 29.6833,
    description: 'A private Adventist boarding school in Ruhango district known for excellent discipline.',
    yearEstablished: 1921,
    totalStudents: 800,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Ecole Secondaire Nyange',
    district: 'Ngororero',
    province: 'Western',
    schoolType: 'GOVERNMENT_AIDED',
    genderPolicy: 'COED',
    boarding: true,
    email: 'nyange@edu.rw',
    phone: '+250788000023',
    latitude: -1.8833,
    longitude: 29.5333,
    description: 'A government aided school in Ngororero district known for its strong community values.',
    yearEstablished: 1980,
    totalStudents: 450,
    status: 'VERIFIED',
    isVerified: true,
  },
  {
    name: 'Groupe Scolaire Rambura',
    district: 'Nyabihu',
    province: 'Western',
    schoolType: 'PUBLIC',
    genderPolicy: 'COED',
    boarding: true,
    email: 'rambura@edu.rw',
    phone: '+250788000024',
    latitude: -1.7000,
    longitude: 29.4833,
    description: 'A public boarding school in Nyabihu district surrounded by beautiful tea plantations.',
    yearEstablished: 1976,
    totalStudents: 480,
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