/**
 * 1-Tap Lesson Routine Templates
 * Dynamically builds an ordered list of activities tailored to the given `standard`.
 */
export const ROUTINE_TEMPLATES = [
  {
    id: 'nacca-standard-50',
    name: 'Standard 50-Min NaCCA Lesson',
    badge: '5 moves · 50 min',
    description: 'Correction → Visual Starter → Group Discussion → Class Exercise → Exit Assignment',
    build: (standard) => {
      const ind = standard?.indicator || 'today’s learning indicator';
      const ex1 = standard?.exemplars?.[0] || `Observe the board example for: ${ind}`;
      const ex2 = standard?.exemplars?.[1] || `Discuss strategies for: ${ind}`;
      const ex3 = standard?.exemplars?.[2] || `Complete 4 practice questions on: ${ind}`;

      return [
        {
          type: 'correction',
          title: 'Review & Correction of Previous Work',
          duration: 10,
          content: `Review previous exercise/homework on the board. Address common errors before introducing: ${ind}`,
        },
        {
          type: 'image_observation',
          title: 'Starter Observation & Concrete Model',
          duration: 10,
          content: `${ex1}\nAsk learners: What patterns or relationships do you notice first?`,
        },
        {
          type: 'discussion',
          title: 'Guided Pair / Group Discussion',
          duration: 10,
          content: `In groups of 4, work through: ${ex2}\nHave 2 groups explain their reasoning to the class.`,
        },
        {
          type: 'exercise',
          title: 'Independent Class Exercise',
          duration: 15,
          content: `Individual work in exercise books:\n• ${ex3}\nCirculate to check understanding and support struggling learners.`,
        },
        {
          type: 'assignment',
          title: 'Exit Ticket & Home Assignment',
          duration: 5,
          content: `Home assignment on "${ind}": Solve 3 follow-up problems in the learner workbook for tomorrow’s correction.`,
        },
      ];
    },
  },
  {
    id: 'direct-practice-40',
    name: '40-Min Direct Practice & Mastery',
    badge: '4 moves · 40 min',
    description: 'Warm-up Correction → Worked Examples → Intensive Class Exercise → Homework',
    build: (standard) => {
      const ind = standard?.indicator || 'the target skill';
      const ex1 = standard?.exemplars?.[0] || `Model step-by-step examples for ${ind}`;
      const ex2 = standard?.exemplars?.[1] || `Practice problems on ${ind}`;

      return [
        {
          type: 'correction',
          title: 'Quick Warm-Up & Homework Check',
          duration: 5,
          content: 'Check homework completion and solve 1 tricky question together on the board.',
        },
        {
          type: 'reading',
          title: 'Worked Examples & Rule Breakdown',
          duration: 10,
          content: `Read and work through step-by-step on the board:\n• ${ex1}`,
        },
        {
          type: 'exercise',
          title: 'Guided & Independent Practice',
          duration: 20,
          content: `Learners solve graded practice exercises in their books:\n• ${ex2}`,
        },
        {
          type: 'assignment',
          title: 'Take-Home Practice',
          duration: 5,
          content: `Complete 4 practice items on: ${ind}`,
        },
      ];
    },
  },
  {
    id: 'inquiry-visual-45',
    name: '45-Min Inquiry & Visual Discovery',
    badge: '4 moves · 45 min',
    description: 'Diagram/Specimen Observation → Video/Demo → Group Investigation → Labeled Exercise',
    build: (standard) => {
      const ind = standard?.indicator || 'the scientific/visual concept';
      const ex1 = standard?.exemplars?.[0] || `Observe the specimen/diagram for ${ind}`;
      const ex2 = standard?.exemplars?.[1] || `Record observations and label key features`;

      return [
        {
          type: 'image_observation',
          title: 'Specimen / Diagram Observation',
          duration: 10,
          content: `Display visual resource or realia:\n• ${ex1}\nLearners list 3 things they observe.`,
        },
        {
          type: 'video',
          title: 'Demonstration / Video Clip',
          duration: 10,
          content: `Demonstrate the process or watch clip illustrating: ${ind}\nNote key vocabulary terms on the board.`,
        },
        {
          type: 'discussion',
          title: 'Think-Pair-Share Investigation',
          duration: 15,
          content: `Compare observations in groups and explain how structure relates to function/outcome.`,
        },
        {
          type: 'exercise',
          title: 'Diagram Labeling & Summary Exercise',
          duration: 10,
          content: `In notebooks:\n• ${ex2}`,
        },
      ];
    },
  },
  {
    id: 'reading-workshop-45',
    name: '45-Min Reading & Comprehension Workshop',
    badge: '4 moves · 45 min',
    description: 'Picture Walk & Prediction → Passage Reading → Main Idea Discussion → Written Comprehension',
    build: (standard) => {
      const ind = standard?.indicator || 'comprehension of grade-level text';
      const ex1 = standard?.exemplars?.[0] || 'Read the passage and state the main idea.';
      const ex2 = standard?.exemplars?.[1] || 'Identify three supporting details from the text.';

      return [
        {
          type: 'image_observation',
          title: 'Pre-Reading Picture Walk & Vocabulary',
          duration: 5,
          content: 'Inspect title and illustrations. Predict what the passage is about and pre-teach 4 key vocabulary words.',
        },
        {
          type: 'reading',
          title: 'Modelled & Guided Passage Reading',
          duration: 15,
          content: `${ex1}\nPause after each paragraph to check literal comprehension.`,
        },
        {
          type: 'discussion',
          title: 'Main Idea & Supporting Evidence Discussion',
          duration: 10,
          content: `In pairs, locate text evidence for:\n• ${ex2}`,
        },
        {
          type: 'exercise',
          title: 'Written Comprehension Exercise',
          duration: 15,
          content: `Answer 5 comprehension questions in full sentences based on "${ind}".`,
        },
      ];
    },
  },
];
