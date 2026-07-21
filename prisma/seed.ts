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

type WordSeed = {
  id: string;
  nepali: string;
  nepaliRoman: string;
  english: string;
  phonetic: string;
  emoji: string;
  order: number;
};

async function upsertLessonWords(
  categoryId: string,
  lessonId: string,
  words: WordSeed[],
) {
  for (const word of words) {
    await prisma.word.upsert({
      where: { id: word.id },
      update: { lessonId, categoryId, ...word },
      create: { ...word, categoryId, lessonId },
    });
  }
}

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
    update: { isLocked: true },
    create: {
      slug: 'animals',
      name: 'Animals',
      emoji: '🐘',
      color: '#e17bcd',
      borderColor: '#006E1C',
      order: 2,
      isLocked: true,
      unlockLevel: 0,
    },
  });

  const vegetables = await prisma.category.upsert({
    where: { slug: 'vegetables' },
    update: { isLocked: true },
    create: {
      slug: 'vegetables',
      name: 'Vegetables',
      emoji: '🥕',
      color: '#FFC107',
      borderColor: '#785900',
      order: 3,
      isLocked: true,
      unlockLevel: 0,
    },
  });

  const bodyParts = await prisma.category.upsert({
    where: { slug: 'body-parts' },
    update: { isLocked: true },
    create: {
      slug: 'body-parts',
      name: 'Body Parts',
      emoji: '✋',
      color: '#D9EDFF',
      borderColor: '#59A6F2',
      order: 4,
      isLocked: true,
      unlockLevel: 0,
    },
  });

  const colors = await prisma.category.upsert({
    where: { slug: 'colors' },
    update: { isLocked: true },
    create: {
      slug: 'colors',
      name: 'Colors & Shapes',
      emoji: '🎨',
      color: '#E8D5FF',
      borderColor: '#7B2FBE',
      order: 5,
      isLocked: true,
      unlockLevel: 0,
    },
  });

  // ── Lessons (2 per chapter) ───────────────────────────────────────
  const fruitsLesson1 = await prisma.lesson.upsert({
    where: { slug: 'fruits-lesson-1' },
    update: { name: 'Fruit Basics', order: 1, categoryId: fruits.id },
    create: {
      id: 'fruits-lesson-1-id',
      slug: 'fruits-lesson-1',
      name: 'Fruit Basics',
      order: 1,
      categoryId: fruits.id,
    },
  });

  const fruitsLesson2 = await prisma.lesson.upsert({
    where: { slug: 'fruits-lesson-2' },
    update: { name: 'More Fruits', order: 2, categoryId: fruits.id },
    create: {
      id: 'fruits-lesson-2-id',
      slug: 'fruits-lesson-2',
      name: 'More Fruits',
      order: 2,
      categoryId: fruits.id,
    },
  });

  const animalsLesson1 = await prisma.lesson.upsert({
    where: { slug: 'animals-lesson-1' },
    update: { name: 'Farm Friends', order: 1, categoryId: animals.id },
    create: {
      id: 'animals-lesson-1-id',
      slug: 'animals-lesson-1',
      name: 'Farm Friends',
      order: 1,
      categoryId: animals.id,
    },
  });

  const animalsLesson2 = await prisma.lesson.upsert({
    where: { slug: 'animals-lesson-2' },
    update: { name: 'Wild Animals', order: 2, categoryId: animals.id },
    create: {
      id: 'animals-lesson-2-id',
      slug: 'animals-lesson-2',
      name: 'Wild Animals',
      order: 2,
      categoryId: animals.id,
    },
  });

  const vegetablesLesson1 = await prisma.lesson.upsert({
    where: { slug: 'vegetables-lesson-1' },
    update: { name: 'Veggie Starters', order: 1, categoryId: vegetables.id },
    create: {
      id: 'vegetables-lesson-1-id',
      slug: 'vegetables-lesson-1',
      name: 'Veggie Starters',
      order: 1,
      categoryId: vegetables.id,
    },
  });

  const vegetablesLesson2 = await prisma.lesson.upsert({
    where: { slug: 'vegetables-lesson-2' },
    update: { name: 'Kitchen Veggies', order: 2, categoryId: vegetables.id },
    create: {
      id: 'vegetables-lesson-2-id',
      slug: 'vegetables-lesson-2',
      name: 'Kitchen Veggies',
      order: 2,
      categoryId: vegetables.id,
    },
  });

  const bodyLesson1 = await prisma.lesson.upsert({
    where: { slug: 'body-parts-lesson-1' },
    update: { name: 'Face & Hands', order: 1, categoryId: bodyParts.id },
    create: {
      id: 'body-parts-lesson-1-id',
      slug: 'body-parts-lesson-1',
      name: 'Face & Hands',
      order: 1,
      categoryId: bodyParts.id,
    },
  });

  const bodyLesson2 = await prisma.lesson.upsert({
    where: { slug: 'body-parts-lesson-2' },
    update: { name: 'Arms & Legs', order: 2, categoryId: bodyParts.id },
    create: {
      id: 'body-parts-lesson-2-id',
      slug: 'body-parts-lesson-2',
      name: 'Arms & Legs',
      order: 2,
      categoryId: bodyParts.id,
    },
  });

  const colorsLesson1 = await prisma.lesson.upsert({
    where: { slug: 'colors-lesson-1' },
    update: { name: 'Primary Colors', order: 1, categoryId: colors.id },
    create: {
      id: 'colors-lesson-1-id',
      slug: 'colors-lesson-1',
      name: 'Primary Colors',
      order: 1,
      categoryId: colors.id,
    },
  });

  const colorsLesson2 = await prisma.lesson.upsert({
    where: { slug: 'colors-lesson-2' },
    update: { name: 'Light & Dark', order: 2, categoryId: colors.id },
    create: {
      id: 'colors-lesson-2-id',
      slug: 'colors-lesson-2',
      name: 'Light & Dark',
      order: 2,
      categoryId: colors.id,
    },
  });

  // ── Fruits Words ──────────────────────────────────────────────────
  await upsertLessonWords(fruits.id, fruitsLesson1.id, [
    { id: 'fruits-1', nepali: 'केरा', nepaliRoman: 'kera', english: 'Banana', phonetic: '/bəˈnænə/', emoji: '🍌', order: 1 },
    { id: 'fruits-2', nepali: 'स्याउ', nepaliRoman: 'syau', english: 'Apple', phonetic: '/ˈæp.əl/', emoji: '🍎', order: 2 },
    { id: 'fruits-3', nepali: 'आँप', nepaliRoman: 'aamp', english: 'Mango', phonetic: '/ˈmæŋ.ɡoʊ/', emoji: '🥭', order: 3 },
    { id: 'fruits-4', nepali: 'सुन्तला', nepaliRoman: 'suntala', english: 'Orange', phonetic: '/ˈɔːr.ɪndʒ/', emoji: '🍊', order: 4 },
  ]);

  await upsertLessonWords(fruits.id, fruitsLesson2.id, [
    { id: 'fruits-5', nepali: 'अङ्गुर', nepaliRoman: 'angur', english: 'Grape', phonetic: '/ɡreɪp/', emoji: '🍇', order: 5 },
    { id: 'fruits-6', nepali: 'लिची', nepaliRoman: 'lichi', english: 'Lychee', phonetic: '/ˈlaɪ.tʃiː/', emoji: '🍈', order: 6 },
    { id: 'fruits-7', nepali: 'अनार', nepaliRoman: 'anar', english: 'Pomegranate', phonetic: '/ˈpɒm.ɪ.ɡræn.ɪt/', emoji: '🍑', order: 7 },
  ]);

  // ── Animals Words ─────────────────────────────────────────────────
  await upsertLessonWords(animals.id, animalsLesson1.id, [
    { id: 'animals-1', nepali: 'कुकुर', nepaliRoman: 'kukur', english: 'Dog', phonetic: '/dɒɡ/', emoji: '🐶', order: 1 },
    { id: 'animals-2', nepali: 'बिरालो', nepaliRoman: 'biralo', english: 'Cat', phonetic: '/kæt/', emoji: '🐱', order: 2 },
    { id: 'animals-3', nepali: 'गाई', nepaliRoman: 'gai', english: 'Cow', phonetic: '/kaʊ/', emoji: '🐄', order: 3 },
    { id: 'animals-4', nepali: 'बाँदर', nepaliRoman: 'bandar', english: 'Monkey', phonetic: '/ˈmʌŋ.ki/', emoji: '🐵', order: 4 },
  ]);

  await upsertLessonWords(animals.id, animalsLesson2.id, [
    { id: 'animals-5', nepali: 'हात्ती', nepaliRoman: 'hatti', english: 'Elephant', phonetic: '/ˈel.ɪ.fənt/', emoji: '🐘', order: 5 },
    { id: 'animals-6', nepali: 'बाघ', nepaliRoman: 'bagh', english: 'Tiger', phonetic: '/ˈtaɪ.ɡər/', emoji: '🐯', order: 6 },
    { id: 'animals-7', nepali: 'सिंह', nepaliRoman: 'sinh', english: 'Lion', phonetic: '/laɪ.ən/', emoji: '🦁', order: 7 },
  ]);

  // ── Vegetables Words ──────────────────────────────────────────────
  await upsertLessonWords(vegetables.id, vegetablesLesson1.id, [
    { id: 'vegetables-1', nepali: 'गाजर', nepaliRoman: 'gajar', english: 'Carrot', phonetic: '/ˈkær.ət/', emoji: '🥕', order: 1 },
    { id: 'vegetables-2', nepali: 'आलु', nepaliRoman: 'aalu', english: 'Potato', phonetic: '/pəˈteɪ.toʊ/', emoji: '🥔', order: 2 },
    { id: 'vegetables-3', nepali: 'टमाटर', nepaliRoman: 'tamatar', english: 'Tomato', phonetic: '/təˈmɑː.toʊ/', emoji: '🍅', order: 3 },
  ]);

  await upsertLessonWords(vegetables.id, vegetablesLesson2.id, [
    { id: 'vegetables-4', nepali: 'प्याज', nepaliRoman: 'pyaaj', english: 'Onion', phonetic: '/ˈʌn.jən/', emoji: '🧅', order: 4 },
    { id: 'vegetables-5', nepali: 'लसुन', nepaliRoman: 'lasun', english: 'Garlic', phonetic: '/ˈɡɑːr.lɪk/', emoji: '🧄', order: 5 },
    { id: 'vegetables-6', nepali: 'अदुवा', nepaliRoman: 'lasun', english: 'Ginger', phonetic: '/ˈdʒɪn.dʒər/', emoji: '🫚', order: 6 },
  ]);

  // ── Body Parts Words ──────────────────────────────────────────────
  await upsertLessonWords(bodyParts.id, bodyLesson1.id, [
    { id: 'body-1', nepali: 'आँखा', nepaliRoman: 'ankha', english: 'Eye', phonetic: '/aɪ/', emoji: '👁️', order: 1 },
    { id: 'body-2', nepali: 'हात', nepaliRoman: 'haat', english: 'Hand', phonetic: '/hænd/', emoji: '✋', order: 2 },
    { id: 'body-3', nepali: 'नाक', nepaliRoman: 'naak', english: 'Nose', phonetic: '/noʊz/', emoji: '👃', order: 3 },
  ]);

  await upsertLessonWords(bodyParts.id, bodyLesson2.id, [
    { id: 'body-4', nepali: 'कान', nepaliRoman: 'kaan', english: 'Ear', phonetic: '/ɪər/', emoji: '👂', order: 4 },
    { id: 'body-5', nepali: 'मुख', nepaliRoman: 'mukh', english: 'Mouth', phonetic: '/maʊθ/', emoji: '👄', order: 5 },
    { id: 'body-6', nepali: 'खुट्टा', nepaliRoman: 'khutta', english: 'Leg', phonetic: '/lɛɡ/', emoji: '🦵', order: 6 },
  ]);

  // ── Colors & Shapes Words ─────────────────────────────────────────
  await upsertLessonWords(colors.id, colorsLesson1.id, [
    { id: 'colors-1', nepali: 'रातो', nepaliRoman: 'rato', english: 'Red', phonetic: '/rɛd/', emoji: '🔴', order: 1 },
    { id: 'colors-2', nepali: 'निलो', nepaliRoman: 'nilo', english: 'Blue', phonetic: '/bluː/', emoji: '🔵', order: 2 },
    { id: 'colors-3', nepali: 'हरियो', nepaliRoman: 'hariyo', english: 'Green', phonetic: '/ɡriːn/', emoji: '🟢', order: 3 },
  ]);

  await upsertLessonWords(colors.id, colorsLesson2.id, [
    { id: 'colors-4', nepali: 'पहेँलो', nepaliRoman: 'pahenlo', english: 'Yellow', phonetic: '/ˈjel.oʊ/', emoji: '🟡', order: 4 },
    { id: 'colors-5', nepali: 'कालो', nepaliRoman: 'kalo', english: 'Black', phonetic: '/blæk/', emoji: '⚫', order: 5 },
    { id: 'colors-6', nepali: 'सेतो', nepaliRoman: 'seto', english: 'White', phonetic: '/waɪt/', emoji: '⚪', order: 6 },
  ]);

  // ── FillBlank Questions ───────────────────────────────────────────
  const fillBlanksData = [
    // Fruits Lesson 2 — sentence in Nepali, answer in English, hint shows Nepali word
    { id: 'fb-fruits-2-1', lessonId: fruitsLesson2.id, wordId: 'fruits-5', sentenceTemplate: 'मलाई अमिलो ___ मनपर्छ।', blankAnswer: 'grape', englishHint: 'अङ्गुर (Angur)', emoji: '🍇', order: 1 },
    { id: 'fb-fruits-2-2', lessonId: fruitsLesson2.id, wordId: 'fruits-6', sentenceTemplate: 'यो मीठो ___ हो।', blankAnswer: 'lychee', englishHint: 'लिची (Lichi)', emoji: '🍈', order: 2 },
    { id: 'fb-fruits-2-3', lessonId: fruitsLesson2.id, wordId: 'fruits-7', sentenceTemplate: 'रातो ___ स्वास्थ्यको लागि राम्रो हो।', blankAnswer: 'pomegranate', englishHint: 'अनार (Anaar)', emoji: '🍑', order: 3 },

    // Animals Lesson 2
    { id: 'fb-animals-2-1', lessonId: animalsLesson2.id, wordId: 'animals-5', sentenceTemplate: '___ सबैभन्दा ठूलो जनावर हो।', blankAnswer: 'elephant', englishHint: 'हात्ती (Haatti)', emoji: '🐘', order: 1 },
    { id: 'fb-animals-2-2', lessonId: animalsLesson2.id, wordId: 'animals-6', sentenceTemplate: 'हाम्रो राष्ट्रिय जनावर ___ हो।', blankAnswer: 'tiger', englishHint: 'बाघ (Baagh)', emoji: '🐯', order: 2 },
    { id: 'fb-animals-2-3', lessonId: animalsLesson2.id, wordId: 'animals-7', sentenceTemplate: '___ जंगलको राजा हो।', blankAnswer: 'lion', englishHint: 'सिंह (Singha)', emoji: '🦁', order: 3 },

    // Vegetables Lesson 2
    { id: 'fb-vegetables-2-1', lessonId: vegetablesLesson2.id, wordId: 'vegetables-4', sentenceTemplate: 'तरकारीमा ___ हाल्नुपर्छ।', blankAnswer: 'onion', englishHint: 'प्याज (Pyaaj)', emoji: '🧅', order: 1 },
    { id: 'fb-vegetables-2-2', lessonId: vegetablesLesson2.id, wordId: 'vegetables-5', sentenceTemplate: '___ स्वास्थ्यको लागि धेरै राम्रो हो।', blankAnswer: 'garlic', englishHint: 'लसुन (Lasun)', emoji: '🧄', order: 2 },
    { id: 'fb-vegetables-2-3', lessonId: vegetablesLesson2.id, wordId: 'vegetables-6', sentenceTemplate: 'चियामा ___ हाल्दा मीठो हुन्छ।', blankAnswer: 'ginger', englishHint: 'अदुवा (Aduwa)', emoji: '🫚', order: 3 },

    // Body Parts Lesson 2
    { id: 'fb-body-2-1', lessonId: bodyLesson2.id, wordId: 'body-4', sentenceTemplate: 'हामी ___ ले सुन्छौं।', blankAnswer: 'ear', englishHint: 'कान (Kaan)', emoji: '👂', order: 1 },
    { id: 'fb-body-2-2', lessonId: bodyLesson2.id, wordId: 'body-5', sentenceTemplate: 'हामी ___ ले खान्छौं।', blankAnswer: 'mouth', englishHint: 'मुख (Mukha)', emoji: '👄', order: 2 },
    { id: 'fb-body-2-3', lessonId: bodyLesson2.id, wordId: 'body-6', sentenceTemplate: 'हामी ___ ले हिँड्छौं।', blankAnswer: 'leg', englishHint: 'खुट्टा (Khutta)', emoji: '🦵', order: 3 },

    // Colors Lesson 2
    { id: 'fb-colors-2-1', lessonId: colorsLesson2.id, wordId: 'colors-4', sentenceTemplate: 'पाकेको आँप ___ हुन्छ।', blankAnswer: 'yellow', englishHint: 'पहेँलो (Pahenlo)', emoji: '🟡', order: 1 },
    { id: 'fb-colors-2-2', lessonId: colorsLesson2.id, wordId: 'colors-5', sentenceTemplate: 'कागको रंग ___ हुन्छ।', blankAnswer: 'black', englishHint: 'कालो (Kaalo)', emoji: '⚫', order: 2 },
    { id: 'fb-colors-2-3', lessonId: colorsLesson2.id, wordId: 'colors-6', sentenceTemplate: 'दूधको रंग ___ हुन्छ।', blankAnswer: 'white', englishHint: 'सेतो (Seto)', emoji: '⚪', order: 3 },
  ];

  for (const fb of fillBlanksData) {
    await prisma.fillBlank.upsert({
      where: { id: fb.id },
      update: fb,
      create: fb,
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
  console.log(`   Lessons:    ${await prisma.lesson.count()}`);
  console.log(`   Words:      ${await prisma.word.count()}`);
  console.log(`   FillBlanks: ${await prisma.fillBlank.count()}`);
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
