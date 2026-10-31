import { computed, reactive, ref } from 'vue';
import { MAX_CUSTOM_MOODS, MAX_CUSTOM_NAME_LENGTH, MAX_NOTE_LENGTH } from '../constants/app';
import { MOOD_PRESETS, getPresetById } from '../constants/moods';
import type { BackupFileV1, ImportMode, ImportStats } from '../types/backup';
import type {
  CustomMood,
  MoodPreset,
  MoodPresetId,
  MoodRecord,
  MoodSelection,
  StorageDataV1,
} from '../types/mood';
import { downloadBackupFile, importData } from '../utils/backup';
import { toDateKey } from '../utils/date';
import {
  createEmptyStorageData,
  loadStorageData,
  persistStorageData,
  writePreImportBackup,
} from '../utils/storage';
import { charCount, normalizeName, trimToChars } from '../utils/text';

type StoreResult<T> = { ok: true; value: T } | { ok: false; error: string };

const state = reactive({
  data: createEmptyStorageData(),
  available: true,
  initialized: false,
  issues: [] as string[],
});

const todayKey = ref(toDateKey());
const revision = ref(0);

const todayRecord = computed<MoodRecord | null>(
  () => state.data.records[todayKey.value] ?? null,
);
const customMoods = computed<readonly CustomMood[]>(() => state.data.customMoods);

function ensureInitialized(): void {
  if (state.initialized) {
    return;
  }

  const loaded = loadStorageData();
  state.data = loaded.data;
  state.available = loaded.available;
  state.issues = loaded.issues;
  state.initialized = true;
}

function refreshTodayKey(): boolean {
  const next = toDateKey();
  if (next === todayKey.value) {
    return false;
  }

  todayKey.value = next;
  revision.value += 1;
  return true;
}

function selectionFromPreset(preset: MoodPreset): MoodSelection {
  return {
    id: preset.id,
    name: preset.name,
    emoji: preset.emoji,
    score: preset.score,
    color: preset.color,
    isCustom: false,
  };
}

function selectionFromCustom(mood: CustomMood): MoodSelection {
  return {
    id: mood.id,
    name: mood.name,
    emoji: mood.emoji,
    score: mood.score,
    color: mood.color,
    isCustom: true,
  };
}

function selectionFromRecord(record: MoodRecord): MoodSelection {
  return {
    id: record.moodId,
    name: record.moodName,
    emoji: record.emoji,
    score: record.score,
    color: record.color,
    isCustom: record.isCustom,
  };
}

function persistNext(next: StorageDataV1): StoreResult<{ persisted: boolean }> {
  if (!state.available) {
    state.data = next;
    revision.value += 1;
    return { ok: true, value: { persisted: false } };
  }

  const result = persistStorageData(next);
  if (!result.ok) {
    return { ok: false, error: result.error ?? '保存失败，请重试' };
  }

  state.data = next;
  revision.value += 1;
  return { ok: true, value: { persisted: true } };
}

function saveTodayRecord(
  selection: MoodSelection,
  note: string,
): StoreResult<{ record: MoodRecord; replaced: boolean; persisted: boolean }> {
  ensureInitialized();
  refreshTodayKey();

  const date = todayKey.value;
  const existing = state.data.records[date];
  const now = new Date().toISOString();
  const record: MoodRecord = {
    date,
    moodId: selection.id,
    moodName: selection.name,
    emoji: selection.emoji,
    score: selection.score,
    color: selection.color,
    isCustom: selection.isCustom,
    note: trimToChars(note.trim(), MAX_NOTE_LENGTH),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const next: StorageDataV1 = {
    ...state.data,
    records: { ...state.data.records, [date]: record },
  };

  const persisted = persistNext(next);
  if (!persisted.ok) {
    return persisted;
  }

  return {
    ok: true,
    value: { record, replaced: Boolean(existing), persisted: persisted.value.persisted },
  };
}

function addCustomMood(
  name: string,
  baseId: MoodPresetId,
): StoreResult<{ mood: CustomMood; persisted: boolean }> {
  ensureInitialized();

  const normalized = normalizeName(name);
  const length = charCount(normalized);
  if (length < 1 || length > MAX_CUSTOM_NAME_LENGTH) {
    return { ok: false, error: `名称需为 1–${MAX_CUSTOM_NAME_LENGTH} 个字符` };
  }

  const reserved = new Set<string>(MOOD_PRESETS.map((mood) => mood.name));
  for (const mood of state.data.customMoods) {
    reserved.add(mood.name);
  }
  if (reserved.has(normalized)) {
    return { ok: false, error: '已经有同名情绪了，换一个吧' };
  }

  if (state.data.customMoods.length >= MAX_CUSTOM_MOODS) {
    return { ok: false, error: `最多添加 ${MAX_CUSTOM_MOODS} 个自定义情绪` };
  }

  const base = getPresetById(baseId);
  const now = new Date().toISOString();
  const randomPart =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  const mood: CustomMood = {
    id: `custom-${randomPart}`,
    name: normalized,
    baseId: base.id,
    emoji: base.emoji,
    score: base.score,
    color: base.color,
    createdAt: now,
    updatedAt: now,
  };

  const next: StorageDataV1 = {
    ...state.data,
    customMoods: [...state.data.customMoods, mood],
  };

  const persisted = persistNext(next);
  if (!persisted.ok) {
    return persisted;
  }

  return {
    ok: true,
    value: { mood, persisted: persisted.value.persisted },
  };
}

function removeCustomMood(id: CustomMood['id']): StoreResult<{ persisted: boolean }> {
  ensureInitialized();

  if (!state.data.customMoods.some((mood) => mood.id === id)) {
    return { ok: false, error: '这个自定义情绪不存在' };
  }

  const next: StorageDataV1 = {
    ...state.data,
    customMoods: state.data.customMoods.filter((mood) => mood.id !== id),
  };

  return persistNext(next);
}

function importBackup(file: BackupFileV1, mode: ImportMode): StoreResult<ImportStats> {
  ensureInitialized();

  if (!state.available) {
    return { ok: false, error: '当前浏览器无法持久化保存，无法导入备份' };
  }

  const backup = writePreImportBackup(state.data);
  if (!backup.ok) {
    return { ok: false, error: backup.error ?? '无法创建导入前备份，已取消导入' };
  }

  const imported = importData(state.data, file.data, mode);
  if (!imported.ok) {
    return imported;
  }

  const write = persistStorageData(imported.data);
  if (!write.ok) {
    return { ok: false, error: write.error ?? '导入失败，请重试' };
  }

  state.data = imported.data;
  state.issues = [];
  revision.value += 1;
  refreshTodayKey();

  return { ok: true, value: imported.stats };
}

function exportBackup(): StoreResult<{ fileName: string }> {
  ensureInitialized();

  try {
    const fileName = downloadBackupFile(state.data);
    return { ok: true, value: { fileName } };
  } catch {
    return { ok: false, error: '导出失败，请重试' };
  }
}

function clearIssues(): void {
  state.issues = [];
}

export function useMoodStore() {
  ensureInitialized();

  return {
    state,
    presets: MOOD_PRESETS,
    todayKey,
    todayRecord,
    customMoods,
    revision,
    refreshTodayKey,
    saveTodayRecord,
    addCustomMood,
    removeCustomMood,
    importBackup,
    exportBackup,
    clearIssues,
    selectionFromPreset,
    selectionFromCustom,
    selectionFromRecord,
  };
}

export type MoodStore = ReturnType<typeof useMoodStore>;
