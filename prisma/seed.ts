import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Muku database...');

  // ── Categories ────────────────────────────────────────────────────
  const fruits = await prisma.category.upsert({
    where: { slug: 'fruits' },
    update: {},
    create: {
      slug: 'fruits',
      name: 'Fruits',
      emoji: '🍎',
      color: '#FD8863',
      borderColor: '#9F4122',
      order: 1,
      isLocked: false,
      unlockLevel: 0,
    },
  });

  const animals = await prisma.category.upsert({
    where: { slug: 'animals' },
    update: {},
    create: {
      slug: 'animals',
      name: 'Animals',
      emoji: '🐘',
      color: '#e17bcd',
      borderColor: '#006E1C',
      order: 2,
      isLocked: false,
      unlockLevel: 0,
    },
  });

  const vegetables = await prisma.category.upsert({
    where: { slug: 'vegetables' },
    update: {},
    create: {
      slug: 'vegetables',
      name: 'Vegetables',
      emoji: '🥕',
      color: '#FFC107',
      borderColor: '#785900',
      order: 3,
      isLocked: false,
      unlockLevel: 0,
    },
  });

  const bodyParts = await prisma.category.upsert({
    where: { slug: 'body-parts' },
    update: {},
    create: {
      slug: 'body-parts',
      name: 'Body Parts',
      emoji: '✋',
      color: '#D9EDFF',
      borderColor: '#59A6F2',
      order: 4,
      isLocked: false,
      unlockLevel: 0,
    },
  });

  const colors = await prisma.category.upsert({
    where: { slug: 'colors' },
    update: {},
    create: {
      slug: 'colors',
      name: 'Colors & Shapes',
      emoji: '🎨',
      color: '#E8D5FF',
      borderColor: '#7B2FBE',
      order: 5,
      isLocked: true,
      unlockLevel: 5,
    },
  });

  // ── Fruits Words ──────────────────────────────────────────────────
  const fruitsWords = [
    { nepali: 'केरा', nepaliRoman: 'kera', english: 'Banana', phonetic: '/bəˈnænə/', emoji: '🍌', order: 1 },
    { nepali: 'स्याउ', nepaliRoman: 'syau', english: 'Apple', phonetic: '/ˈæp.əl/', emoji: '🍎', order: 2 },
    { nepali: 'आँप', nepaliRoman: 'aamp', english: 'Mango', phonetic: '/ˈmæŋ.ɡoʊ/', emoji: '🥭', order: 3 },
    { nepali: 'सुन्तला', nepaliRoman: 'suntala', english: 'Orange', phonetic: '/ˈɔːr.ɪndʒ/', emoji: '🍊', order: 4 },
    { nepali: 'अङ्गुर', nepaliRoman: 'angur', english: 'Grape', phonetic: '/ɡreɪp/', emoji: '🍇', order: 5 },
    { nepali: 'लिची', nepaliRoman: 'lichi', english: 'Lychee', phonetic: '/ˈlaɪ.tʃiː/', emoji: '🍈', order: 6 },
    { nepali: 'अनार', nepaliRoman: 'anar', english: 'Pomegranate', phonetic: '/ˈpɒm.ɪ.ɡræn.ɪt/', emoji: '🍑', order: 7 },
  ];

  for (const word of fruitsWords) {
    await prisma.word.upsert({
      where: { id: `fruits-${word.order}` },
      update: {},
      create: { id: `fruits-${word.order}`, categoryId: fruits.id, ...word },
    });
  }

  // ── Animals Words ─────────────────────────────────────────────────
  const animalsWords = [
    { nepali: 'हात्ती', nepaliRoman: 'hatti', english: 'Elephant', phonetic: '/ˈel.ɪ.fənt/', emoji: '🐘', order: 1 },
    { nepali: 'बाघ', nepaliRoman: 'bagh', english: 'Tiger', phonetic: '/ˈtaɪ.ɡər/', emoji: '🐯', order: 2 },
    { nepali: 'कुकुर', nepaliRoman: 'kukur', english: 'Dog', phonetic: '/dɒɡ/', emoji: '🐶', order: 3 },
    { nepali: 'बिरालो', nepaliRoman: 'biralo', english: 'Cat', phonetic: '/kæt/', emoji: '🐱', order: 4 },
    { nepali: 'गाई', nepaliRoman: 'gai', english: 'Cow', phonetic: '/kaʊ/', emoji: '🐄', order: 5 },
    { nepali: 'बाँदर', nepaliRoman: 'bandar', english: 'Monkey', phonetic: '/ˈmʌŋ.ki/', emoji: '🐵', order: 6 },
    { nepali: 'सिंह', nepaliRoman: 'sinh', english: 'Lion', phonetic: '/laɪ.ən/', emoji: '🦁', order: 7 },
  ];

  for (const word of animalsWords) {
    await prisma.word.upsert({
      where: { id: `animals-${word.order}` },
      update: {},
      create: { id: `animals-${word.order}`, categoryId: animals.id, ...word },
    });
  }

  // ── Vegetables Words ──────────────────────────────────────────────
  const vegetableWords = [
    { nepali: 'गाजर', nepaliRoman: 'gajar', english: 'Carrot', phonetic: '/ˈkær.ət/', emoji: '🥕', order: 1 },
    { nepali: 'आलु', nepaliRoman: 'aalu', english: 'Potato', phonetic: '/pəˈteɪ.toʊ/', emoji: '🥔', order: 2 },
    { nepali: 'टमाटर', nepaliRoman: 'tamatar', english: 'Tomato', phonetic: '/təˈmɑː.toʊ/', emoji: '🍅', order: 3 },
    { nepali: 'प्याज', nepaliRoman: 'pyaaj', english: 'Onion', phonetic: '/ˈʌn.jən/', emoji: '🧅', order: 4 },
    { nepali: 'लसुन', nepaliRoman: 'lasun', english: 'Garlic', phonetic: '/ˈɡɑːr.lɪk/', emoji: '🧄', order: 5 },
  ];

  for (const word of vegetableWords) {
    await prisma.word.upsert({
      where: { id: `vegetables-${word.order}` },
      update: {},
      create: { id: `vegetables-${word.order}`, categoryId: vegetables.id, ...word },
    });
  }

  // ── Body Parts Words ──────────────────────────────────────────────
  const bodyWords = [
    { nepali: 'आँखा', nepaliRoman: 'ankha', english: 'Eye', phonetic: '/aɪ/', emoji: '👁️', order: 1 },
    { nepali: 'हात', nepaliRoman: 'haat', english: 'Hand', phonetic: '/hænd/', emoji: '✋', order: 2 },
    { nepali: 'नाक', nepaliRoman: 'naak', english: 'Nose', phonetic: '/noʊz/', emoji: '👃', order: 3 },
    { nepali: 'कान', nepaliRoman: 'kaan', english: 'Ear', phonetic: '/ɪər/', emoji: '👂', order: 4 },
    { nepali: 'मुख', nepaliRoman: 'mukh', english: 'Mouth', phonetic: '/maʊθ/', emoji: '👄', order: 5 },
    { nepali: 'खुट्टा', nepaliRoman: 'khutta', english: 'Leg', phonetic: '/lɛɡ/', emoji: '🦵', order: 6 },
  ];

  for (const word of bodyWords) {
    await prisma.word.upsert({
      where: { id: `body-${word.order}` },
      update: {},
      create: { id: `body-${word.order}`, categoryId: bodyParts.id, ...word },
    });
  }

  // ── Badges ────────────────────────────────────────────────────────
  const badges = [
    { slug: 'first-lesson', name: 'First Step', emoji: '⭐', description: 'Completed your very first lesson' },
    { slug: 'streak-3', name: '3-Day Streak', emoji: '🔥', description: 'Kept a streak for 3 days' },
    { slug: 'streak-7', name: 'Week Warrior', emoji: '🏆', description: 'Kept a 7-day streak' },
    { slug: 'perfect-score', name: 'Perfect!', emoji: '💯', description: 'Got 100% accuracy in a lesson' },
    { slug: 'fast-learner', name: 'Speed Learner', emoji: '⚡', description: 'Finished a lesson in under 1 minute' },
    { slug: 'xp-100', name: 'Century', emoji: '🥇', description: 'Reached 100 XP' },
    { slug: 'all-categories', name: 'Explorer', emoji: '🎯', description: 'Played all available categories' },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: badge,
    });
  }

  console.log('✅ Seeding complete!');
  console.log(`   Categories: ${await prisma.category.count()}`);
  console.log(`   Words:      ${await prisma.word.count()}`);
  console.log(`   Badges:     ${await prisma.badge.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
