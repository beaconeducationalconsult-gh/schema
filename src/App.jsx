import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NowScreen from './features/now/NowScreen';
import AppNav from './components/AppNav';
import DialogHost from './components/DialogHost';
import { useLiveQuery } from 'dexie-react-hooks';
import { isOnboarded } from './db/settings';
import OnboardingScreen from './features/onboarding/OnboardingScreen';
import ClassReminders from './components/ClassReminders';
import PwaBanners from './pwa/PwaBanners';

// The home screen loads eagerly; everything else is split into its own chunk.
const WeekScreen = lazy(() => import('./features/schedule/WeekScreen'));
const CurriculumScreen = lazy(() => import('./features/curriculum/CurriculumScreen'));
const NotesScreen = lazy(() => import('./features/notes/NotesScreen'));
const HistoryScreen = lazy(() => import('./features/history/HistoryScreen'));
const SettingsScreen = lazy(() => import('./features/settings/SettingsScreen'));
const LessonScreen = lazy(() => import('./features/lesson/LessonScreen'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28" role="status" aria-label="Loading">
      <div className="max-w-3xl mx-auto p-4 space-y-3 animate-pulse">
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function App() {
  // undefined while the first read is in flight; flips live when onboarding completes
  const onboarded = useLiveQuery(isOnboarded, [], undefined);

  if (onboarded === undefined) return null;
  if (!onboarded) {
    return (
      <>
        <OnboardingScreen />
        <DialogHost />
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<NowScreen />} />
          <Route path="/schedule" element={<WeekScreen />} />
          <Route path="/timetable" element={<Navigate to="/schedule" replace />} />
          <Route path="/curriculum" element={<CurriculumScreen />} />
          <Route path="/notes" element={<NotesScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/lesson/:id" element={<LessonScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ClassReminders />
      <PwaBanners />
      <DialogHost />
      <AppNav />
    </>
  );
}
