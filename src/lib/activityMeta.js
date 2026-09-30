/**
 * One place for how each activity type looks and what its quick-add form says.
 * `color`/`hover` are full Tailwind class names on purpose (Tailwind can only
 * generate classes it can find as literal strings in the source).
 */
export const ACTIVITY_META = {
  exercise: {
    label: 'Exercise',
    emoji: '✏️',
    color: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    placeholder: 'Type the exercise prompt for the class…',
    defaultTitle: 'Class Exercise',
  },
  correction: {
    label: 'Correction',
    emoji: '✅',
    color: 'bg-emerald-600',
    hover: 'hover:bg-emerald-700',
    placeholder: 'What are you correcting and what to focus on…',
    defaultTitle: 'Correction',
  },
  image_observation: {
    label: 'Image',
    emoji: '🖼️',
    color: 'bg-purple-600',
    hover: 'hover:bg-purple-700',
    placeholder: 'Describe the image and what learners should observe…',
    defaultTitle: 'Image Observation',
  },
  video: {
    label: 'Video',
    emoji: '🎬',
    color: 'bg-rose-600',
    hover: 'hover:bg-rose-700',
    placeholder: 'Video title/link and what to note while watching…',
    defaultTitle: 'Video Watching',
  },
  reading: {
    label: 'Reading',
    emoji: '📖',
    color: 'bg-amber-600',
    hover: 'hover:bg-amber-700',
    placeholder: 'Passage/page and what to identify while reading…',
    defaultTitle: 'Reading',
  },
  discussion: {
    label: 'Discussion',
    emoji: '💬',
    color: 'bg-cyan-600',
    hover: 'hover:bg-cyan-700',
    placeholder: 'Group discussion question…',
    defaultTitle: 'Group Discussion',
  },
  assignment: {
    label: 'Assignment',
    emoji: '📝',
    // zinc, not slate: slate is remapped in dark mode, this must stay a mid-tone fill
    color: 'bg-zinc-600',
    hover: 'hover:bg-zinc-700',
    placeholder: 'Home assignment details…',
    defaultTitle: 'Home Assignment',
  },
};
