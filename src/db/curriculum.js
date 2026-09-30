import { db } from './schema';
import { settings } from './helpers';

/* Full tree for a subject: strands → subStrands → standards (with resource counts) */
export async function loadSubjectTree(subjectId) {
  const strands = await db.strands
    .where('subjectId').equals(subjectId).sortBy('order');

  const tree = [];
  for (const strand of strands) {
    const subStrands = await db.subStrands
      .where('strandId').equals(strand.id).sortBy('order');

    const subTree = [];
    for (const sub of subStrands) {
      const standards = await db.standards
        .where('subStrandId').equals(sub.id).sortBy('order');
      const enrichedStds = [];
      for (const std of standards) {
        const resList = await db.resources.where('standardId').equals(std.id).toArray();
        enrichedStds.push({ ...std, resources: resList });
      }
      subTree.push({ ...sub, standards: enrichedStds });
    }
    tree.push({ ...strand, subStrands: subTree });
  }
  return tree;
}

/**
 * Returns a flat, ordered array of all standards under a subject:
 * [{ standard, subStrand, strand, index }]
 */
export async function getOrderedStandardsForSubject(subjectId) {
  if (!subjectId) return [];
  const strands = await db.strands
    .where('subjectId').equals(subjectId).sortBy('order');

  const ordered = [];
  for (const strand of strands) {
    const subStrands = await db.subStrands
      .where('strandId').equals(strand.id).sortBy('order');
    for (const subStrand of subStrands) {
      const stds = await db.standards
        .where('subStrandId').equals(subStrand.id).sortBy('order');
      for (const standard of stds) {
        ordered.push({
          standard,
          subStrand,
          strand,
          index: ordered.length,
        });
      }
    }
  }
  return ordered;
}

/**
 * Given a subjectId and currentStandardId, find the current position and the next standard in sequence.
 */
export async function getNextStandardForSubject(subjectId, currentStandardId) {
  const ordered = await getOrderedStandardsForSubject(subjectId);
  if (ordered.length === 0) {
    return { current: null, next: null, index: -1, total: 0 };
  }
  const idx = ordered.findIndex(item => item.standard.id === currentStandardId);
  if (idx === -1) {
    return {
      current: null,
      next: ordered[0],
      index: 0,
      total: ordered.length,
    };
  }
  return {
    current: ordered[idx],
    next: idx + 1 < ordered.length ? ordered[idx + 1] : null,
    index: idx,
    total: ordered.length,
  };
}

/**
 * Advances the subject's `currentStandardBySubject` pointer to the next standard in sequence.
 */
export async function advanceSubjectStandard(subjectId, currentStandardId) {
  const { next } = await getNextStandardForSubject(subjectId, currentStandardId);
  if (next?.standard?.id) {
    await settings.setCurrentStandard(subjectId, next.standard.id);
    return next;
  }
  return null;
}

/* Counts for the subject list badges */
export async function subjectStats(subjectId) {
  const strands = await db.strands.where('subjectId').equals(subjectId).toArray();
  let subStrands = 0, standards = 0;
  for (const s of strands) {
    const subs = await db.subStrands.where('strandId').equals(s.id).toArray();
    subStrands += subs.length;
    for (const sub of subs) {
      standards += await db.standards.where('subStrandId').equals(sub.id).count();
    }
  }
  return { strands: strands.length, subStrands, standards };
}

/* Order helpers — append with next order value */
export async function nextOrder(table, whereKey, whereValue) {
  const rows = await db[table].where(whereKey).equals(whereValue).toArray();
  return rows.reduce((max, r) => Math.max(max, r.order ?? 0), -1) + 1;
}

/* Cascade delete — removes children + attached resources too */
export async function deleteStrand(strandId) {
  await db.transaction('rw', db.strands, db.subStrands, db.standards, db.resources, async () => {
    const subs = await db.subStrands.where('strandId').equals(strandId).toArray();
    for (const sub of subs) {
      const stds = await db.standards.where('subStrandId').equals(sub.id).toArray();
      for (const std of stds) {
        await db.resources.where('standardId').equals(std.id).delete();
      }
      await db.standards.where('subStrandId').equals(sub.id).delete();
    }
    await db.subStrands.where('strandId').equals(strandId).delete();
    await db.strands.delete(strandId);
  });
}

export async function deleteSubStrand(subId) {
  await db.transaction('rw', db.subStrands, db.standards, db.resources, async () => {
    const stds = await db.standards.where('subStrandId').equals(subId).toArray();
    for (const std of stds) {
      await db.resources.where('standardId').equals(std.id).delete();
    }
    await db.standards.where('subStrandId').equals(subId).delete();
    await db.subStrands.delete(subId);
  });
}

export async function deleteStandard(id) {
  await db.transaction('rw', db.standards, db.resources, async () => {
    await db.resources.where('standardId').equals(id).delete();
    await db.standards.delete(id);
  });
}

/**
 * Bulk import CSV or TSV rows for a subject.
 * Columns expected (with or without header):
 * Strand, Sub-strand, Content Standard, Indicator, Exemplars (separated by ; or |)
 */
export async function bulkImportCurriculum(subjectId, rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (!lines.length) return { strandsCreated: 0, subStrandsCreated: 0, standardsCreated: 0 };

  const isTsv = lines[0].includes('\t');
  const parseLine = (line) => {
    if (isTsv) return line.split('\t').map(s => s.trim());
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  let rows = lines.map(parseLine);
  if (rows[0][0] && /^strand$/i.test(rows[0][0])) {
    rows = rows.slice(1);
  }

  let strandsCreated = 0;
  let subStrandsCreated = 0;
  let standardsCreated = 0;

  await db.transaction('rw', db.strands, db.subStrands, db.standards, async () => {
    for (const cols of rows) {
      const [strandName, subStrandName, contentStandard, indicator = '', exemplarsRaw = ''] = cols;
      if (!strandName || !subStrandName || !contentStandard) continue;

      let existingStrands = await db.strands.where('subjectId').equals(subjectId).toArray();
      let strand = existingStrands.find(s => s.name.toLowerCase() === strandName.toLowerCase());
      if (!strand) {
        const id = await db.strands.add({
          subjectId,
          name: strandName,
          order: existingStrands.length,
        });
        strand = await db.strands.get(id);
        strandsCreated++;
      }

      let existingSubs = await db.subStrands.where('strandId').equals(strand.id).toArray();
      let sub = existingSubs.find(s => s.name.toLowerCase() === subStrandName.toLowerCase());
      if (!sub) {
        const id = await db.subStrands.add({
          strandId: strand.id,
          name: subStrandName,
          order: existingSubs.length,
        });
        sub = await db.subStrands.get(id);
        subStrandsCreated++;
      }

      const existingStds = await db.standards.where('subStrandId').equals(sub.id).toArray();
      const exemplars = exemplarsRaw
        ? exemplarsRaw.split(/[;|]/).map(e => e.trim()).filter(Boolean)
        : [];
      await db.standards.add({
        subStrandId: sub.id,
        order: existingStds.length,
        contentStandard,
        indicator,
        exemplars,
      });
      standardsCreated++;
    }
  });

  return { strandsCreated, subStrandsCreated, standardsCreated };
}
