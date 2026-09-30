import React, { useEffect, useRef, useState } from 'react';
import { activityRepo } from '../../db/helpers';
import { ACTIVITY_META } from './LessonScreen';
import ResourceGallery from '../../components/ResourceGallery';
import CompleteLessonModal from '../../components/CompleteLessonModal';

export default function GuidedMode({ data, onExit, onProgress }) {
  const { subject, standard, activities, resources = [] } = data;
  const [index, setIndex] = useState(() => {
    const first = activities.findIndex(a => !a.done);
    return first === -1 ? 0 : first;
  });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const tickRef = useRef(null);

  const current = activities[index];

  // Reset timer whenever the step changes
  useEffect(() => {
    if (!current) return;
    setSecondsLeft((current.duration || 0) * 60);
    setRunning(false);
  }, [current?.id]);

  // Countdown
  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-semibold">No activities to run</h2>
          <button
            onClick={onExit}
            className="mt-4 px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-medium"
          >
            Back to lesson
          </button>
        </div>
      </div>
    );
  }

  const meta = ACTIVITY_META[current.type] || ACTIVITY_META.exercise;
  const pct = current.duration ? 1 - secondsLeft / (current.duration * 60) : 0;
  const isVisualStep =
    current.type === 'image_observation' ||
    current.type === 'video' ||
    current.type === 'reading';

  const next = () => {
    if (index < activities.length - 1) setIndex(index + 1);
  };
  const prev = () => {
    if (index > 0) setIndex(index - 1);
  };
  const markDone = async () => {
    await activityRepo.update(current.id, { done: true });
    onProgress?.();
    if (index < activities.length - 1) {
      next();
    } else {
      // Final step completed -> trigger Smart Curriculum Progression modal!
      setCompleteOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={onExit} className="text-sm text-white/70 hover:text-white">
          ✕ Exit
        </button>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-white/50">
            {subject?.name} · {standard?.indicator?.slice(0, 40) || ''}
          </div>
          <div className="text-sm font-medium">
            Step {index + 1} of {activities.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {resources.length > 0 && (
            <button
              onClick={() => setShowMedia(m => !m)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-300 font-medium"
            >
              🖼️ Media ({resources.length})
            </button>
          )}
          <button
            onClick={() => setShowPlan(s => !s)}
            className="text-sm text-white/70 hover:text-white"
          >
            {showPlan ? 'Hide' : 'Plan'}
          </button>
        </div>
      </div>

      {/* Progress rail */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${((index + 1) / activities.length) * 100}%` }}
        />
      </div>

      {/* Plan drawer */}
      {showPlan && (
        <div className="bg-slate-800 border-b border-white/10 max-h-56 overflow-y-auto">
          {activities.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setIndex(i)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                i === index ? 'bg-slate-700' : ''
              }`}
            >
              <span>{ACTIVITY_META[a.type]?.emoji}</span>
              <span className="flex-1 truncate">{a.title}</span>
              {a.done && <span className="text-emerald-400 text-xs">done</span>}
            </button>
          ))}
        </div>
      )}

      {/* Media drawer */}
      {showMedia && resources.length > 0 && (
        <div className="bg-slate-800/95 border-b border-white/10 p-4">
          <div className="max-w-3xl mx-auto">
            <ResourceGallery resources={resources} dark compact />
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${meta.color} mb-4`}
        >
          {meta.emoji}
        </div>

        <div className="text-[10px] uppercase tracking-widest text-white/50">
          {meta.label} · {current.duration} min
        </div>
        <h1 className="text-2xl font-bold text-center mt-2 max-w-2xl">
          {current.title}
        </h1>

        {current.content && (
          <p className="text-white/80 text-center mt-3 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed">
            {current.content}
          </p>
        )}

        {/* Inline Visual Resource card when on an Image/Video/Reading step */}
        {isVisualStep && resources.length > 0 && (
          <div className="mt-6 w-full max-w-2xl bg-slate-800/70 border border-white/10 rounded-2xl p-4">
            <ResourceGallery resources={resources} dark compact />
          </div>
        )}

        {/* Timer */}
        <div className="mt-8 text-center">
          <div className="text-6xl font-mono tabular-nums">{fmt(secondsLeft)}</div>
          <div className="text-xs text-white/40 mt-1">
            {secondsLeft > 0 ? 'remaining' : 'time up'}
          </div>
          <div className="w-64 h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden mx-auto">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, pct * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setRunning(r => !r)}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
          >
            {running ? '⏸ Pause' : '▶ Start Timer'}
          </button>
          <button
            onClick={() => {
              setSecondsLeft((current.duration || 0) * 60);
              setRunning(false);
            }}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={prev}
          disabled={index === 0}
          className="px-4 py-3 rounded-xl bg-white/10 text-sm disabled:opacity-30"
        >
          ← Prev
        </button>
        <button
          onClick={markDone}
          className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-medium"
        >
          ✓ {index === activities.length - 1 ? 'Done & Wrap Up Lesson' : 'Done & Next'}
        </button>
        <button
          onClick={next}
          disabled={index === activities.length - 1}
          className="px-4 py-3 rounded-xl bg-white/10 text-sm disabled:opacity-30"
        >
          Skip →
        </button>
      </div>

      {completeOpen && (
        <CompleteLessonModal
          data={data}
          onClose={() => setCompleteOpen(false)}
          onCompleted={() => {
            setCompleteOpen(false);
            onProgress?.();
            onExit();
          }}
        />
      )}
    </div>
  );
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
