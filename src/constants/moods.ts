import type { MoodPreset, MoodPresetId } from '../types/mood';

export const MOOD_PRESETS = [
  { id: 'happy', name: '开心', emoji: '😄', score: 5, color: '#F59E0B' },
  { id: 'content', name: '满足', emoji: '😌', score: 4, color: '#10B981' },
  { id: 'calm', name: '平静', emoji: '😐', score: 3, color: '#0EA5E9' },
  { id: 'tired', name: '疲惫', emoji: '😪', score: 2, color: '#8B5CF6' },
  { id: 'anxious', name: '焦虑', emoji: '😰', score: 2, color: '#F43F5E' },
  { id: 'sad', name: '难过', emoji: '😢', score: 1, color: '#64748B' },
  { id: 'angry', name: '生气', emoji: '😠', score: 1, color: '#EF4444' },
] as const satisfies readonly MoodPreset[];

export const PRESET_IDS: readonly MoodPresetId[] = MOOD_PRESETS.map((mood) => mood.id);

export function isPresetId(value: string): value is MoodPresetId {
  return (PRESET_IDS as readonly string[]).includes(value);
}

export function getPresetById(id: MoodPresetId): MoodPreset {
  const preset = MOOD_PRESETS.find((mood) => mood.id === id);
  if (!preset) {
    throw new Error(`Unknown mood preset: ${id}`);
  }
  return preset;
}

export function getPresetByName(name: string): MoodPreset | undefined {
  return MOOD_PRESETS.find((mood) => mood.name === name);
}
