export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type MoodPresetId =
  | 'happy'
  | 'content'
  | 'calm'
  | 'tired'
  | 'anxious'
  | 'sad'
  | 'angry';

export type CustomMoodId = `custom-${string}`;
export type MoodId = MoodPresetId | CustomMoodId;

/** 预设情绪，集中配置，v1 内只读 */
export interface MoodPreset {
  readonly id: MoodPresetId;
  readonly name: string;
  readonly emoji: string;
  readonly score: MoodScore;
  readonly color: string;
}

/** 自定义情绪，创建时对继承信息做快照 */
export interface CustomMood {
  id: CustomMoodId;
  name: string;
  baseId: MoodPresetId;
  emoji: string;
  score: MoodScore;
  color: string;
  createdAt: string;
  updatedAt: string;
}

/** 一条每日记录；展示字段均快照化 */
export interface MoodRecord {
  date: string;
  moodId: MoodId;
  moodName: string;
  emoji: string;
  score: MoodScore;
  color: string;
  isCustom: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
}

/** 当前表单中被选中的情绪，来源可以是预设、自定义或历史快照 */
export interface MoodSelection {
  id: MoodId;
  name: string;
  emoji: string;
  score: MoodScore;
  color: string;
  isCustom: boolean;
}

/** localStorage 业务数据 */
export interface StorageDataV1 {
  version: 1;
  records: Record<string, MoodRecord>;
  customMoods: CustomMood[];
}

/** localStorage 用户偏好 */
export interface PreferencesV1 {
  version: 1;
  muted: boolean;
}
