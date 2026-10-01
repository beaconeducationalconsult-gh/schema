import React from 'react';
import { Link } from 'react-router-dom';
import { activityRepo } from '../../db/helpers';
import ActivityList from './ActivityList';
import { EmptyActivities } from './LessonStates';

export default function TeachingPlan({ lessonId, activities, onRoutine, onAddActivity }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Teaching plan ({activities.length})
        </h2>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => onRoutine()}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-medium"
          >
            ⚡ Load Routine Template
          </button>
          {activities.length > 0 && (
            <Link
              to={`/lesson/${lessonId}?guided=1`}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              ▶ Guided Mode
            </Link>
          )}
        </div>
      </div>

      {activities.length === 0 ? (
        <EmptyActivities onAdd={() => onAddActivity()} onLoadRoutine={() => onRoutine()} />
      ) : (
        <ActivityList
          activities={activities}
          onReorder={(ids) => activityRepo.reorder(lessonId, ids)}
        />
      )}
    </section>
  );
}
