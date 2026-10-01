import React, { useState } from 'react';
import ActivityBlock from './ActivityBlock';

export default function ActivityList({ activities, onReorder }) {
  const [dragged, setDragged] = useState(null);

  const move = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= activities.length) return;
    const next = [...activities];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    onReorder(next.map(a => a.id));
  };

  return (
    <ol className="space-y-2">
      {activities.map((a, idx) => (
        <li
          key={a.id}
          draggable
          onDragStart={() => setDragged(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            onReorder(swap(activities, dragged, idx).map(x => x.id));
            setDragged(null);
          }}
        >
          <ActivityBlock
            activity={a}
            index={idx}
            onMoveUp={() => move(idx, idx - 1)}
            onMoveDown={() => move(idx, idx + 1)}
          />
        </li>
      ))}
    </ol>
  );
}

function swap(arr, i, j) {
  if (i === j || i == null || j == null) return arr;
  const a = [...arr];
  const [x] = a.splice(i, 1);
  a.splice(j, 0, x);
  return a;
}
