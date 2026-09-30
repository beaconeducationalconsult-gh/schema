import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NowScreen from './features/now/NowScreen';
import WeekScreen from './features/schedule/WeekScreen';
import CurriculumScreen from './features/curriculum/CurriculumScreen';
import NotesScreen from './features/notes/NotesScreen';
import HistoryScreen from './features/history/HistoryScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import LessonScreen from './features/lesson/LessonScreen';
import AppNav from './components/AppNav';
import PwaBanners from './pwa/PwaBanners';

export default function App() {
  return (
    <>
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
      <PwaBanners />
      <AppNav />
    </>
  );
}
