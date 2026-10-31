import { MAX_BACKUP_FILE_BYTES } from '../constants/app';
import type { BackupFileV1, BackupPreview } from '../types/backup';
import { toBackupPreview } from '../utils/backup';
import { validateBackupFile } from '../utils/validation';

export interface ParsedBackup {
  file: BackupFileV1;
  preview: BackupPreview;
}

export type ParseBackupResult =
  | { ok: true; value: ParsedBackup }
  | { ok: false; error: string };

export async function parseBackupFile(file: File): Promise<ParseBackupResult> {
  if (file.size > MAX_BACKUP_FILE_BYTES) {
    return { ok: false, error: '备份文件超过 5MB，无法导入' };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: '无法读取文件，请重试' };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: '备份文件格式不正确，未导入任何数据' };
  }

  const result = validateBackupFile(json);
  if (!result.ok) {
    return {
      ok: false,
      error: result.issues[0] ?? '备份文件格式不正确，未导入任何数据',
    };
  }

  return {
    ok: true,
    value: {
      file: result.value,
      preview: toBackupPreview(result.value, file.name),
    },
  };
}
