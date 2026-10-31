import { MAX_CUSTOM_MOODS, MAX_CUSTOM_NAME_LENGTH, MAX_NOTE_LENGTH } from '../constants/app';
import { MOOD_PRESETS, isPresetId } from '../constants/moods';
import type { BackupFileV1 } from '../types/backup';
import type { CustomMood, MoodRecord, MoodScore, StorageDataV1 } from '../types/mood';
import { isValidDateKey } from './date';
import { charCount, normalizeName } from './text';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: string[] };

const PRESET_NAMES = new Set<string>(MOOD_PRESETS.map((mood) => mood.name));
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isMoodScore(value: unknown): value is MoodScore {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

interface ParsedCustomMood {
  mood?: CustomMood;
  issue?: string;
}

function parseCustomMood(raw: unknown, names: Set<string>): ParsedCustomMood {
  if (!isPlainObject(raw)) {
    return { issue: '格式不正确' };
  }

  const id = raw.id;
  if (typeof id !== 'string' || !id.startsWith('custom-')) {
    return { issue: 'ID 不合法' };
  }

  const rawName = raw.name;
  if (typeof rawName !== 'string') {
    return { issue: '名称不合法' };
  }

  const name = normalizeName(rawName);
  const nameLength = charCount(name);
  if (nameLength < 1 || nameLength > MAX_CUSTOM_NAME_LENGTH) {
    return { issue: `名称需为 1–${MAX_CUSTOM_NAME_LENGTH} 个字符` };
  }
  if (PRESET_NAMES.has(name)) {
    return { issue: `名称「${name}」与预设情绪重复` };
  }
  if (names.has(name)) {
    return { issue: `名称「${name}」重复` };
  }

  const baseId = raw.baseId;
  if (typeof baseId !== 'string' || !isPresetId(baseId)) {
    return { issue: '挂靠的预设情绪不合法' };
  }

  const emoji = raw.emoji;
  if (typeof emoji !== 'string' || emoji.length === 0 || charCount(emoji) > 8) {
    return { issue: 'Emoji 不合法' };
  }

  if (!isMoodScore(raw.score)) {
    return { issue: '情绪分值需为 1–5 的整数' };
  }

  if (!isHexColor(raw.color)) {
    return { issue: '颜色需为 #RRGGBB 格式' };
  }

  if (!isIsoDate(raw.createdAt) || !isIsoDate(raw.updatedAt)) {
    return { issue: '时间字段不合法' };
  }

  names.add(name);

  return {
    mood: {
      id: id as CustomMood['id'],
      name,
      baseId,
      emoji,
      score: raw.score,
      color: raw.color,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
  };
}

interface ParsedRecord {
  record?: MoodRecord;
  issue?: string;
}

function parseMoodRecord(raw: unknown, key: string): ParsedRecord {
  if (!isPlainObject(raw)) {
    return { issue: '格式不正确' };
  }

  const date = raw.date;
  if (typeof date !== 'string' || !isValidDateKey(date) || date !== key) {
    return { issue: '日期不合法或与键不一致' };
  }

  const moodId = raw.moodId;
  if (
    typeof moodId !== 'string' ||
    (!isPresetId(moodId) && !moodId.startsWith('custom-'))
  ) {
    return { issue: '情绪 ID 不合法' };
  }

  const isCustom = raw.isCustom;
  if (typeof isCustom !== 'boolean' || isCustom !== !isPresetId(moodId)) {
    return { issue: 'isCustom 与情绪 ID 不一致' };
  }

  const moodName = raw.moodName;
  if (
    typeof moodName !== 'string' ||
    normalizeName(moodName).length === 0 ||
    charCount(moodName) > 20
  ) {
    return { issue: '情绪名称不合法' };
  }

  const emoji = raw.emoji;
  if (typeof emoji !== 'string' || emoji.length === 0 || charCount(emoji) > 8) {
    return { issue: 'Emoji 不合法' };
  }

  if (!isMoodScore(raw.score)) {
    return { issue: '情绪分值需为 1–5 的整数' };
  }

  if (!isHexColor(raw.color)) {
    return { issue: '颜色需为 #RRGGBB 格式' };
  }

  const note = raw.note;
  if (typeof note !== 'string' || charCount(note) > MAX_NOTE_LENGTH) {
    return { issue: `备注不能超过 ${MAX_NOTE_LENGTH} 个字符` };
  }

  if (!isIsoDate(raw.createdAt) || !isIsoDate(raw.updatedAt)) {
    return { issue: '时间字段不合法' };
  }

  return {
    record: {
      date,
      moodId: moodId as MoodRecord['moodId'],
      moodName,
      emoji,
      score: raw.score,
      color: raw.color,
      isCustom,
      note,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
  };
}

export interface SanitizedStorage {
  data: StorageDataV1 | null;
  issues: string[];
}

export function sanitizeStorageData(value: unknown): SanitizedStorage {
  if (!isPlainObject(value) || value.version !== 1) {
    return { data: null, issues: ['本地数据版本或结构不受支持'] };
  }

  if (!isPlainObject(value.records)) {
    return { data: null, issues: ['本地记录结构不正确'] };
  }

  if (!Array.isArray(value.customMoods)) {
    return { data: null, issues: ['本地自定义情绪结构不正确'] };
  }

  const issues: string[] = [];
  const names = new Set<string>(PRESET_NAMES);
  const customMoods: CustomMood[] = [];

  value.customMoods.slice(0, MAX_CUSTOM_MOODS).forEach((raw, index) => {
    const parsed = parseCustomMood(raw, names);
    if (parsed.mood) {
      customMoods.push(parsed.mood);
    } else {
      issues.push(`第 ${index + 1} 个自定义情绪已忽略：${parsed.issue ?? '格式不正确'}`);
    }
  });

  if (value.customMoods.length > MAX_CUSTOM_MOODS) {
    issues.push(`自定义情绪超过 ${MAX_CUSTOM_MOODS} 个，多余项已忽略`);
  }

  const records: Record<string, MoodRecord> = {};
  for (const [key, raw] of Object.entries(value.records)) {
    const parsed = parseMoodRecord(raw, key);
    if (parsed.record) {
      records[key] = parsed.record;
    } else {
      issues.push(`记录 ${key} 已忽略：${parsed.issue ?? '格式不正确'}`);
    }
  }

  return {
    data: { version: 1, records, customMoods },
    issues,
  };
}

export function validateStorageDataStrict(value: unknown): ValidationResult<StorageDataV1> {
  if (!isPlainObject(value)) {
    return { ok: false, issues: ['数据结构不正确'] };
  }
  if (value.version !== 1) {
    return { ok: false, issues: ['数据版本不受支持'] };
  }

  const recordsRaw = value.records;
  if (!isPlainObject(recordsRaw)) {
    return { ok: false, issues: ['records 字段不正确'] };
  }

  const moodsRaw = value.customMoods;
  if (!Array.isArray(moodsRaw)) {
    return { ok: false, issues: ['customMoods 字段不正确'] };
  }

  const issues: string[] = [];
  const names = new Set<string>(PRESET_NAMES);
  const customMoods: CustomMood[] = [];

  if (moodsRaw.length > MAX_CUSTOM_MOODS) {
    issues.push(`自定义情绪不能超过 ${MAX_CUSTOM_MOODS} 个`);
  }

  moodsRaw.forEach((raw, index) => {
    const parsed = parseCustomMood(raw, names);
    if (parsed.mood) {
      customMoods.push(parsed.mood);
    } else {
      issues.push(`第 ${index + 1} 个自定义情绪：${parsed.issue ?? '格式不正确'}`);
    }
  });

  const records: Record<string, MoodRecord> = {};
  for (const [key, raw] of Object.entries(recordsRaw)) {
    const parsed = parseMoodRecord(raw, key);
    if (parsed.record) {
      records[key] = parsed.record;
    } else {
      issues.push(`记录 ${key}：${parsed.issue ?? '格式不正确'}`);
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, value: { version: 1, records, customMoods } };
}

export function validateBackupFile(value: unknown): ValidationResult<BackupFileV1> {
  if (!isPlainObject(value)) {
    return { ok: false, issues: ['备份文件格式不正确'] };
  }
  if (value.app !== 'everydayEmotion') {
    return { ok: false, issues: ['这不是 everydayEmotion 的备份文件'] };
  }
  if (value.exportVersion !== 1) {
    if (typeof value.exportVersion === 'number' && value.exportVersion > 1) {
      return { ok: false, issues: ['备份文件版本过新，请更新应用后再试'] };
    }
    return { ok: false, issues: ['备份文件版本不受支持'] };
  }
  if (!isIsoDate(value.exportedAt)) {
    return { ok: false, issues: ['备份文件的导出时间不正确'] };
  }

  const dataResult = validateStorageDataStrict(value.data);
  if (!dataResult.ok) {
    return { ok: false, issues: dataResult.issues };
  }

  return {
    ok: true,
    value: {
      app: 'everydayEmotion',
      exportVersion: 1,
      exportedAt: value.exportedAt,
      data: dataResult.value,
    },
  };
}
