import { STORAGE_KEYS } from '../constants/storage';
import type { PreferencesV1, StorageDataV1 } from '../types/mood';
import { sanitizeStorageData } from './validation';

export interface LoadDataResult {
  data: StorageDataV1;
  available: boolean;
  issues: string[];
}

export interface WriteResult {
  ok: boolean;
  error?: string;
}

export function createEmptyStorageData(): StorageDataV1 {
  return { version: 1, records: {}, customMoods: [] };
}

export function createDefaultPreferences(): PreferencesV1 {
  return { version: 1, muted: false };
}

function isStorageAvailable(): boolean {
  try {
    const key = '__everyday_emotion_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
  }
  return error instanceof Error && error.name === 'QuotaExceededError';
}

function backupCorruptRaw(raw: string): boolean {
  try {
    window.localStorage.setItem(`${STORAGE_KEYS.corruptBackupPrefix}${Date.now()}`, raw);
    return true;
  } catch {
    return false;
  }
}

export function loadStorageData(): LoadDataResult {
  if (!isStorageAvailable()) {
    return {
      data: createEmptyStorageData(),
      available: false,
      issues: ['当前浏览器无法持久化保存，刷新后记录会丢失'],
    };
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEYS.data);
  } catch {
    return {
      data: createEmptyStorageData(),
      available: false,
      issues: ['当前浏览器无法持久化保存，刷新后记录会丢失'],
    };
  }

  if (!raw) {
    return { data: createEmptyStorageData(), available: true, issues: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const backedUp = backupCorruptRaw(raw);
    return {
      data: createEmptyStorageData(),
      available: true,
      issues: [
        backedUp
          ? '本地数据读取失败，已备份原始数据并重新开始'
          : '本地数据读取失败，已重新开始',
      ],
    };
  }

  const { data, issues } = sanitizeStorageData(parsed);
  if (!data) {
    const backedUp = backupCorruptRaw(raw);
    return {
      data: createEmptyStorageData(),
      available: true,
      issues: [
        backedUp
          ? '本地数据读取失败，已备份原始数据并重新开始'
          : '本地数据读取失败，已重新开始',
        ...issues,
      ],
    };
  }

  return { data, available: true, issues };
}

export function persistStorageData(data: StorageDataV1): WriteResult {
  try {
    window.localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(data));
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, error: '保存失败，请检查浏览器存储空间' };
    }
    return { ok: false, error: '当前浏览器无法持久化保存，刷新后记录会丢失' };
  }
}

export function writePreImportBackup(data: StorageDataV1): WriteResult {
  try {
    const snapshot = {
      backedUpAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(STORAGE_KEYS.preImportBackup, JSON.stringify(snapshot));
    return { ok: true };
  } catch {
    return { ok: false, error: '无法创建导入前备份，已取消导入' };
  }
}

export function loadPreferences(): PreferencesV1 {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.prefs);
    if (!raw) {
      return createDefaultPreferences();
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      'muted' in parsed &&
      parsed.version === 1 &&
      typeof parsed.muted === 'boolean'
    ) {
      return { version: 1, muted: parsed.muted };
    }
  } catch {
    // 偏好读取失败时回退到默认值，不影响核心记录。
  }

  return createDefaultPreferences();
}

export function persistPreferences(preferences: PreferencesV1): WriteResult {
  try {
    window.localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(preferences));
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, error: '保存失败，请检查浏览器存储空间' };
    }
    return { ok: false, error: '当前浏览器无法持久化保存，刷新后设置会丢失' };
  }
}
