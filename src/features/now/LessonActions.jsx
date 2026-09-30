import React from 'react';
import { Link } from 'react-router-dom';

export default function LessonActions({ lesson, onCompleteLesson }) {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Link
          to={`/lesson/${lesson.id}`}
          className="text-center py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-medium text-sm shadow-sm"
        >
          Open Lesson Plan
        </Link>
        <Link
          to={`/lesson/${lesson.id}?guided=1`}
          className="text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm"
        >
          ▶ Start Guided Mode
        </Link>
        <button
          onClick={onCompleteLesson}
          className="text-center py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm"
        >
          ✓ Complete & Advance
        </button>
      </div>
    </div>
  );
}
