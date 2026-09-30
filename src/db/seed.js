import { db, ACTIVITY_TYPES } from './schema';
import { toDateKey } from './helpers';
import {
  FRACTION_WALL_SVG,
  HUNDREDTHS_GRID_SVG,
  ROOT_SYSTEMS_SVG,
  STORY_MAP_SVG,
  BAR_CHART_SVG,
} from '../lib/classroomMedia';

export async function seedIfEmpty() {
  const count = await db.subjects.count();
  if (count > 0) {
    // Ensure starter resources exist if upgrading from an earlier session
    const resCount = await db.resources.count();
    if (resCount === 0) {
      await seedStarterResourcesOnExisting();
    }
    return;
  }

  await db.transaction(
    'rw',
    [
      db.subjects,
      db.strands,
      db.subStrands,
      db.standards,
      db.timetable,
      db.lessons,
      db.activities,
      db.notes,
      db.resources,
      db.settings,
    ],
    async () => {
      /* ---- Subjects ---- */
      const mathId = await db.subjects.add({
        name: 'Mathematics', color: '#2563eb', icon: 'sigma', order: 0,
      });
      const engId = await db.subjects.add({
        name: 'English Language', color: '#dc2626', icon: 'book', order: 1,
      });
      const sciId = await db.subjects.add({
        name: 'Science', color: '#16a34a', icon: 'flask', order: 2,
      });
      const compId = await db.subjects.add({
        name: 'Computing', color: '#9333ea', icon: 'code', order: 3,
      });

      /* ---- Mathematics chain ---- */
      const numberStrand = await db.strands.add({
        subjectId: mathId, name: 'Strand 1: Number', order: 0,
      });
      const fractionsSub = await db.subStrands.add({
        strandId: numberStrand, name: 'B6.1.3 Fractions, Decimals & Percentages', order: 0,
      });
      const compareStdId = await db.standards.add({
        subStrandId: fractionsSub,
        order: 0,
        contentStandard:
          'B6.1.3.1 Demonstrate understanding of strategies for comparing, adding and subtracting fractions.',
        indicator:
          'B6.1.3.1.1 Compare and order a mixture of common, decimal and percent fractions (up to thousandths).',
        exemplars: [
          'Use paper fraction strips and 10×10 grids to show ½ is greater than ⅓.',
          'Order ⅔, 0.75, 80% from smallest to largest using equivalent benchmarks.',
          'Locate mixed fractions and decimals accurately on a number line.',
        ],
      });

      const addSub = await db.subStrands.add({
        strandId: numberStrand, name: 'B6.1.2 Number Operations', order: 1,
      });
      await db.standards.add({
        subStrandId: addSub,
        order: 0,
        contentStandard:
          'B6.1.2.1 Describe and apply mental mathematics strategies and number properties.',
        indicator: 'B6.1.2.1.2 Multiply multi-digit whole numbers up to 4-digit by 2-digit numbers.',
        exemplars: [
          'Use the area / box model to solve 346 × 24.',
          'Solve real-world market and transport word problems involving multiplication.',
        ],
      });

      const algebraStrand = await db.strands.add({
        subjectId: mathId, name: 'Strand 2: Algebra', order: 1,
      });
      const patternsSub = await db.subStrands.add({
        strandId: algebraStrand, name: 'B6.2.1 Patterns and Relationships', order: 0,
      });
      await db.standards.add({
        subStrandId: patternsSub,
        order: 0,
        contentStandard:
          'B6.2.1.1 Determine the pattern rule to make predictions about subsequent elements.',
        indicator: 'B6.2.1.1.1 Represent a given pattern visually and in a table of values.',
        exemplars: [
          'Build matchstick triangle sequences and record term vs. perimeter.',
          'Predict the 10th term of a growing geometric pattern.',
        ],
      });

      /* ---- English Language chain ---- */
      const readingStrand = await db.strands.add({
        subjectId: engId, name: 'Strand 2: Reading', order: 0,
      });
      const comprehensionSub = await db.subStrands.add({
        strandId: readingStrand, name: 'B6.2.7 Comprehension', order: 0,
      });
      const engStdId = await db.standards.add({
        subStrandId: comprehensionSub,
        order: 0,
        contentStandard:
          'B6.2.7.1 Process and comprehend level-appropriate texts.',
        indicator: 'B6.2.7.1.2 Note and recall main ideas in a sequence and identify supporting details.',
        exemplars: [
          'Read “The Market Day at Makola” and state the paragraph main ideas.',
          'Use a graphic organizer to map main idea + three supporting details.',
          'Respond to inferential questions using text evidence.',
        ],
      });

      const grammarStrand = await db.strands.add({
        subjectId: engId, name: 'Strand 3: Grammar Usage', order: 1,
      });
      const verbsSub = await db.subStrands.add({
        strandId: grammarStrand, name: 'B6.3.5 Verbs & Tense', order: 0,
      });
      await db.standards.add({
        subStrandId: verbsSub,
        order: 0,
        contentStandard:
          'B6.3.5.1 Apply the knowledge of verbs in communication.',
        indicator: 'B6.3.5.1.3 Use the present perfect and past perfect forms of verbs accurately.',
        exemplars: [
          'Contrast simple past and present perfect in classroom dialogues.',
          'Complete cloze sentences using “has/have + past participle”.',
        ],
      });

      /* ---- Science chain ---- */
      const lifeStrand = await db.strands.add({
        subjectId: sciId, name: 'Strand 1: Diversity of Matter', order: 0,
      });
      const plantsSub = await db.subStrands.add({
        strandId: lifeStrand, name: 'B6.1.1 Living and Non-Living Things', order: 0,
      });
      const sciStdId = await db.standards.add({
        subStrandId: plantsSub,
        order: 0,
        contentStandard:
          'B6.1.1.1 Show understanding of the physical features and life processes of living things.',
        indicator: 'B6.1.1.1.1 Classify plants based on their root systems (tap root and fibrous root).',
        exemplars: [
          'Observe uprooted weed specimens (e.g. grass vs. tridax/mango seedling) with hand lenses.',
          'Draw and label tap root and fibrous root systems in science notebooks.',
          'Discuss how root structure helps plants absorb water and anchor in soil.',
        ],
      });

      /* ---- Computing chain ---- */
      const compStrand = await db.strands.add({
        subjectId: compId, name: 'Strand 1: Introduction to Computing', order: 0,
      });
      const dataSub = await db.subStrands.add({
        strandId: compStrand, name: 'B6.1.3 Data, Sources and Usage', order: 0,
      });
      const compStdId = await db.standards.add({
        subStrandId: dataSub,
        order: 0,
        contentStandard:
          'B6.1.3.1 Identify data and collect data from different sources.',
        indicator: 'B6.1.3.1.2 Construct and interpret frequency tables and bar charts from class survey data.',
        exemplars: [
          'Conduct a tally survey of classmates’ modes of transport to school.',
          'Organize raw tallies into a neat frequency table and sketch a bar graph.',
        ],
      });

      /* ---- Starter Visual Resources (offline SVG diagrams & links) ---- */
      await db.resources.bulkAdd([
        {
          standardId: compareStdId,
          type: 'image',
          url: FRACTION_WALL_SVG,
          caption: 'Fraction Wall — Comparing Benchmarks (1, ½, ⅓, ¼, ⅙)',
        },
        {
          standardId: compareStdId,
          type: 'image',
          url: HUNDREDTHS_GRID_SVG,
          caption: '10×10 Hundredths Grid — ¾ = 0.75 = 75%',
        },
        {
          standardId: sciStdId,
          type: 'image',
          url: ROOT_SYSTEMS_SVG,
          caption: 'Plant Root Systems — Tap Root vs. Fibrous Root Diagram',
        },
        {
          standardId: engStdId,
          type: 'image',
          url: STORY_MAP_SVG,
          caption: 'Reading Comprehension — Main Idea & Supporting Details Map',
        },
        {
          standardId: compStdId,
          type: 'image',
          url: BAR_CHART_SVG,
          caption: 'Class Survey Bar Chart — Modes of Transport to School',
        },
      ]);

      /* ---- Settings ---- */
      await db.settings.bulkPut([
        { key: 'schoolName', value: 'Achimota Basic School' },
        { key: 'classLevel', value: 'Basic 6' },
        { key: 'teacherName', value: 'Mr. Kofi Mensah' },
        { key: 'academicYear', value: '2026/2027' },
        {
          key: 'currentStandardBySubject',
          value: {
            [mathId]: compareStdId,
            [engId]: engStdId,
            [sciId]: sciStdId,
            [compId]: compStdId,
          },
        },
        { key: 'seededAt', value: Date.now() },
      ]);

      /* ---- Timetable (Mon–Fri demo) ---- */
      const slots = [
        { dayOfWeek: 1, startTime: '07:40', endTime: '08:40', subjectId: mathId, classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 1, startTime: '08:40', endTime: '09:40', subjectId: engId,  classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:00', subjectId: sciId,  classLevel: 'Basic 6', room: 'Lab 1' },
        { dayOfWeek: 1, startTime: '11:00', endTime: '12:00', subjectId: compId, classLevel: 'Basic 6', room: 'ICT Lab' },

        { dayOfWeek: 2, startTime: '07:40', endTime: '08:40', subjectId: mathId, classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 2, startTime: '08:40', endTime: '09:40', subjectId: engId,  classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 2, startTime: '10:00', endTime: '11:00', subjectId: sciId,  classLevel: 'Basic 6', room: 'Lab 1' },
        { dayOfWeek: 2, startTime: '13:00', endTime: '14:00', subjectId: compId, classLevel: 'Basic 6', room: 'ICT Lab' },

        { dayOfWeek: 3, startTime: '07:40', endTime: '08:40', subjectId: sciId,  classLevel: 'Basic 6', room: 'Lab 1' },
        { dayOfWeek: 3, startTime: '08:40', endTime: '09:40', subjectId: mathId, classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '11:00', subjectId: engId,  classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 3, startTime: '13:00', endTime: '14:00', subjectId: mathId, classLevel: 'Basic 6', room: 'Rm 4' },

        { dayOfWeek: 4, startTime: '07:40', endTime: '08:40', subjectId: mathId, classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 4, startTime: '08:40', endTime: '09:40', subjectId: engId,  classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '11:00', subjectId: compId, classLevel: 'Basic 6', room: 'ICT Lab' },
        { dayOfWeek: 4, startTime: '13:00', endTime: '14:00', subjectId: sciId,  classLevel: 'Basic 6', room: 'Lab 1' },

        { dayOfWeek: 5, startTime: '07:40', endTime: '08:40', subjectId: sciId,  classLevel: 'Basic 6', room: 'Lab 1' },
        { dayOfWeek: 5, startTime: '08:40', endTime: '09:40', subjectId: mathId, classLevel: 'Basic 6', room: 'Rm 4' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '11:00', subjectId: engId,  classLevel: 'Basic 6', room: 'Rm 4' },
      ];
      const slotIds = await db.timetable.bulkAdd(slots, { allKeys: true });

      /* ---- Seed sample lessons for today & yesterday ---- */
      const today = new Date();
      const todayKey = toDateKey(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = toDateKey(yesterday);

      const yLessonId = await db.lessons.add({
        timetableId: slotIds[0],
        standardId: compareStdId,
        date: yesterdayKey,
        status: 'done',
        createdAt: Date.now() - 86400000,
      });
      await db.activities.bulkAdd([
        {
          lessonId: yLessonId,
          type: 'image_observation',
          order: 0,
          duration: 10,
          title: 'Fraction Strip Wall Observation',
          content: 'Display the fraction wall chart on the board. Learners compare 1/2, 1/3, 1/4, and 1/6 strips and state which is larger.',
          done: true,
        },
        {
          lessonId: yLessonId,
          type: 'discussion',
          order: 1,
          duration: 12,
          title: 'Benchmark Strategy Discussion',
          content: 'In pairs, discuss how to compare 3/8 and 5/6 by comparing both to the benchmark 1/2.',
          done: true,
        },
        {
          lessonId: yLessonId,
          type: 'exercise',
          order: 2,
          duration: 15,
          title: 'Comparing Fractions Practice',
          content: 'Compare using <, >, or =: (a) 2/3 __ 3/5  (b) 0.75 __ 3/4  (c) 5/8 __ 60%.',
          done: true,
        },
        {
          lessonId: yLessonId,
          type: 'assignment',
          order: 3,
          duration: 5,
          title: 'Home Assignment: Ordering Fractions',
          content: 'Workbook page 24, Q1–Q5: Order each set of fractions and decimals in ascending order.',
          done: true,
        },
      ]);
      await db.notes.add({
        lessonId: yLessonId,
        standardId: compareStdId,
        body: 'Most learners grasped benchmark 1/2 quickly; 6 learners needed extra help converting 3/5 to percentage.',
        tags: ['remedial', 'fractions'],
        createdAt: Date.now() - 82000000,
      });

      const yEngLessonId = await db.lessons.add({
        timetableId: slotIds[1],
        standardId: engStdId,
        date: yesterdayKey,
        status: 'done',
        createdAt: Date.now() - 80000000,
      });
      await db.activities.bulkAdd([
        {
          lessonId: yEngLessonId,
          type: 'reading',
          order: 0,
          duration: 15,
          title: 'Silent & Guided Reading: The Market Day',
          content: 'Read paragraphs 1–4 of "The Market Day at Makola" aloud and underline key topic sentences.',
          done: true,
        },
        {
          lessonId: yEngLessonId,
          type: 'exercise',
          order: 1,
          duration: 15,
          title: 'Main Idea & Supporting Details Table',
          content: 'Write the main idea of paragraph 2 and list three supporting details in exercise books.',
          done: true,
        },
      ]);
      await db.notes.add({
        lessonId: yEngLessonId,
        standardId: engStdId,
        body: 'Reading fluency improved when learners tracked topic sentences in pairs.',
        tags: ['insight', 'reading'],
        createdAt: Date.now() - 78000000,
      });

      const todayDow = today.getDay();
      const todaySlots = await db.timetable.where('dayOfWeek').equals(todayDow).sortBy('startTime');
      if (todaySlots.length > 0) {
        const firstSlot = todaySlots[0];
        const tLessonId = await db.lessons.add({
          timetableId: firstSlot.id,
          standardId: compareStdId,
          date: todayKey,
          status: 'in_progress',
          createdAt: Date.now() - 1800000,
        });
        await db.activities.bulkAdd([
          {
            lessonId: tLessonId,
            type: 'correction',
            order: 0,
            duration: 10,
            title: 'Correction of Home Assignment',
            content: 'Review Workbook p. 24 Q1–Q5 on the board. Focus on converting fractions to common denominators vs decimals.',
            done: true,
          },
          {
            lessonId: tLessonId,
            type: 'image_observation',
            order: 1,
            duration: 10,
            title: '10×10 Grid & Number Line Observation',
            content: 'Observe the shaded 10×10 hundredths grid and identify the fraction, decimal, and percentage represented.',
            done: false,
          },
          {
            lessonId: tLessonId,
            type: 'discussion',
            order: 2,
            duration: 10,
            title: 'Group Discussion: Ordering Mixed Forms',
            content: 'Groups of 4: Explain the fastest way to order { 2/3, 0.6, 70%, 3/5 } from smallest to largest.',
            done: false,
          },
          {
            lessonId: tLessonId,
            type: 'exercise',
            order: 3,
            duration: 15,
            title: 'Class Exercise: Mixed Fraction & Decimal Comparison',
            content: '1. Order from smallest to largest: 3/4, 0.7, 72%\n2. Which is greater: 5/8 or 0.65? Show your working.',
            done: false,
          },
          {
            lessonId: tLessonId,
            type: 'assignment',
            order: 4,
            duration: 5,
            title: 'Exit Ticket & Homework',
            content: 'Draw a number line from 0 to 1 and mark 1/4, 0.4, 1/2, 0.75, and 90%.',
            done: false,
          },
        ]);
        await db.notes.add({
          lessonId: tLessonId,
          standardId: compareStdId,
          body: 'Bring manila card strips for Group 3 hands-on support.',
          tags: ['prep'],
          createdAt: Date.now() - 900000,
        });
      }

      // Add a standalone curriculum note on Science
      await db.notes.add({
        lessonId: null,
        standardId: sciStdId,
        body: 'Ask learners to bring uprooted grass and tridax weeds from the school compound before Wednesday lab.',
        tags: ['prep', 'homework'],
        createdAt: Date.now() - 3600000,
      });

      console.info('[seed] Teaching Companion seeded.', {
        standards: await db.standards.count(),
        slots: await db.timetable.count(),
        resources: await db.resources.count(),
        activityTypes: ACTIVITY_TYPES.length,
      });
    }
  );
}

async function seedStarterResourcesOnExisting() {
  const stds = await db.standards.toArray();
  const findStd = (substr) =>
    stds.find(s =>
      (s.indicator || '').toLowerCase().includes(substr) ||
      (s.contentStandard || '').toLowerCase().includes(substr)
    );

  const fracStd = findStd('fraction') || stds[0];
  const sciStd  = findStd('root') || findStd('plant');
  const engStd  = findStd('main idea') || findStd('comprehend');
  const compStd = findStd('bar chart') || findStd('data');

  const toAdd = [];
  if (fracStd) {
    toAdd.push(
      {
        standardId: fracStd.id,
        type: 'image',
        url: FRACTION_WALL_SVG,
        caption: 'Fraction Wall — Comparing Benchmarks (1, ½, ⅓, ¼, ⅙)',
      },
      {
        standardId: fracStd.id,
        type: 'image',
        url: HUNDREDTHS_GRID_SVG,
        caption: '10×10 Hundredths Grid — ¾ = 0.75 = 75%',
      }
    );
  }
  if (sciStd) {
    toAdd.push({
      standardId: sciStd.id,
      type: 'image',
      url: ROOT_SYSTEMS_SVG,
      caption: 'Plant Root Systems — Tap Root vs. Fibrous Root Diagram',
    });
  }
  if (engStd) {
    toAdd.push({
      standardId: engStd.id,
      type: 'image',
      url: STORY_MAP_SVG,
      caption: 'Reading Comprehension — Main Idea & Supporting Details Map',
    });
  }
  if (compStd) {
    toAdd.push({
      standardId: compStd.id,
      type: 'image',
      url: BAR_CHART_SVG,
      caption: 'Class Survey Bar Chart — Modes of Transport to School',
    });
  }

  if (toAdd.length) {
    await db.resources.bulkAdd(toAdd);
  }
}
