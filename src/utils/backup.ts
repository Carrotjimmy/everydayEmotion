import { MAX_CUSTOM_MOODS } from '../constants/app';
import type { BackupFileV1, BackupPreview, ImportMode, ImportStats } from '../types/backup';
import type { CustomMood, MoodRecord, StorageDataV1 } from '../types/mood';
import { toDateKey } from './date';

export type ImportDataResult =
  | { ok: true; data: StorageDataV1; stats: ImportStats }
  | { ok: false; error: string };

export function cloneStorageData(data: StorageDataV1): StorageDataV1 {
  return JSON.parse(JSON.stringify(data)) as StorageDataV1;
}

export function buildBackupFile(data: StorageDataV1, now = new Date()): BackupFileV1 {
  return {
    app: 'everydayEmotion',
    exportVersion: 1,
    exportedAt: now.toISOString(),
    data: cloneStorageData(data),
  };
}

export function backupFileName(now = new Date()): string {
  return `everydayEmotion-backup-${toDateKey(now)}.json`;
}

export function toBackupPreview(file: BackupFileV1, fileName: string): BackupPreview {
  const dates = Object.keys(file.data.records).sort();
  return {
    fileName,
    exportedAt: file.exportedAt,
    recordCount: dates.length,
    customMoodCount: file.data.customMoods.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  };
}

export function downloadBackupFile(data: StorageDataV1): string {
  const fileName = backupFileName();
  const file = buildBackupFile(data);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return fileName;
}

function isNewer(incoming: string, current: string): boolean {
  return Date.parse(incoming) > Date.parse(current);
}

export function importData(
  current: StorageDataV1,
  incoming: StorageDataV1,
  mode: ImportMode,
): ImportDataResult {
  if (mode === 'replace') {
    const data = cloneStorageData(incoming);
    return {
      ok: true,
      data,
      stats: {
        mode,
        recordCount: Object.keys(data.records).length,
        customMoodCount: data.customMoods.length,
        addedRecords: 0,
        updatedRecords: 0,
        addedCustomMoods: 0,
        updatedCustomMoods: 0,
      },
    };
  }

  const records: Record<string, MoodRecord> = {};
  for (const [date, record] of Object.entries(current.records)) {
    records[date] = { ...record };
  }

  let addedRecords = 0;
  let updatedRecords = 0;

  for (const [date, record] of Object.entries(incoming.records)) {
    const existing = records[date];
    if (!existing) {
      records[date] = { ...record };
      addedRecords += 1;
    } else if (isNewer(record.updatedAt, existing.updatedAt)) {
      records[date] = { ...record };
      updatedRecords += 1;
    }
  }

  const customMoods: CustomMood[] = current.customMoods.map((mood) => ({ ...mood }));
  let addedCustomMoods = 0;
  let updatedCustomMoods = 0;

  for (const incomingMood of incoming.customMoods) {
    const byIdIndex = customMoods.findIndex((mood) => mood.id === incomingMood.id);
    if (byIdIndex >= 0) {
      if (isNewer(incomingMood.updatedAt, customMoods[byIdIndex].updatedAt)) {
        customMoods[byIdIndex] = { ...incomingMood };
        updatedCustomMoods += 1;
      }
      continue;
    }

    const byNameIndex = customMoods.findIndex((mood) => mood.name === incomingMood.name);
    if (byNameIndex >= 0) {
      if (isNewer(incomingMood.updatedAt, customMoods[byNameIndex].updatedAt)) {
        customMoods[byNameIndex] = { ...incomingMood };
        updatedCustomMoods += 1;
      }
      continue;
    }

    customMoods.push({ ...incomingMood });
    addedCustomMoods += 1;
  }

  if (customMoods.length > MAX_CUSTOM_MOODS) {
    return {
      ok: false,
      error: `合并后自定义情绪将超过 ${MAX_CUSTOM_MOODS} 个，请先清理本机自定义情绪再导入`,
    };
  }

  return {
    ok: true,
    data: { version: 1, records, customMoods },
    stats: {
      mode,
      recordCount: Object.keys(records).length,
      customMoodCount: customMoods.length,
      addedRecords,
      updatedRecords,
      addedCustomMoods,
      updatedCustomMoods,
    },
  };
}
