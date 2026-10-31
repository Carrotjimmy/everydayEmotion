<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';
import { MAX_CUSTOM_NAME_LENGTH } from '../constants/app';
import { MOOD_PRESETS, getPresetById } from '../constants/moods';
import type { CustomMood, MoodPresetId } from '../types/mood';
import { charCount, normalizeName } from '../utils/text';

const props = defineProps<{
  open: boolean;
  customMoods: readonly CustomMood[];
  errorMessage: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'clear-error'): void;
  (e: 'submit', payload: { name: string; baseId: MoodPresetId }): void;
}>();

const name = ref('');
const baseId = ref<MoodPresetId>('calm');
const localError = ref('');

const previewBase = computed(() => getPresetById(baseId.value));
const charTotal = computed(() => charCount(name.value));
const displayError = computed(() => localError.value || props.errorMessage);

watch(
  () => props.open,
  (open) => {
    if (open) {
      name.value = '';
      baseId.value = 'calm';
      localError.value = '';
    }
  },
);

function onInput(): void {
  localError.value = '';
  emit('clear-error');
}

function onSubmit(): void {
  const normalized = normalizeName(name.value);
  const length = charCount(normalized);

  if (length < 1 || length > MAX_CUSTOM_NAME_LENGTH) {
    localError.value = `名称需为 1–${MAX_CUSTOM_NAME_LENGTH} 个字符`;
    return;
  }

  const reserved = new Set<string>(MOOD_PRESETS.map((mood) => mood.name));
  for (const mood of props.customMoods) {
    reserved.add(mood.name);
  }
  if (reserved.has(normalized)) {
    localError.value = '已经有同名情绪了，换一个吧';
    return;
  }

  localError.value = '';
  emit('submit', { name: normalized, baseId: baseId.value });
}
</script>

<template>
  <ModalDialog :open="open" title="新建自定义情绪" @close="emit('close')">
    <form class="custom-form" @submit.prevent="onSubmit">
      <div class="field">
        <label class="field-label" for="custom-mood-name">名称</label>
        <div class="name-row">
          <input
            id="custom-mood-name"
            v-model="name"
            class="name-input"
            type="text"
            autocomplete="off"
            placeholder="比如：加班"
            :aria-invalid="Boolean(displayError)"
            aria-describedby="custom-mood-counter"
            @input="onInput"
          />
          <span id="custom-mood-counter" class="name-counter">
            {{ charTotal }} / {{ MAX_CUSTOM_NAME_LENGTH }}
          </span>
        </div>
      </div>

      <div class="field">
        <span class="field-label" id="custom-mood-base-label">归入</span>
        <div
          class="base-grid"
          role="radiogroup"
          aria-labelledby="custom-mood-base-label"
        >
          <button
            v-for="preset in MOOD_PRESETS"
            :key="preset.id"
            class="base-option"
            :class="{ selected: baseId === preset.id }"
            type="button"
            role="radio"
            :aria-checked="baseId === preset.id"
            :style="{ '--option-color': preset.color }"
            @click="baseId = preset.id"
          >
            <span aria-hidden="true">{{ preset.emoji }}</span>
            <span>{{ preset.name }}</span>
          </button>
        </div>
      </div>

      <div class="preview" aria-live="polite">
        <span class="preview-emoji" aria-hidden="true">{{ previewBase.emoji }}</span>
        <span class="preview-name">{{ normalizeName(name) || '自定义情绪' }}</span>
        <span class="preview-score">{{ previewBase.score }} 分</span>
      </div>

      <p v-if="displayError" class="form-error" role="alert">{{ displayError }}</p>

      <div class="form-actions">
        <button class="btn btn-secondary" type="button" @click="emit('close')">
          取消
        </button>
        <button class="btn btn-primary" type="submit" :disabled="!name.trim()">
          添加
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<style scoped>
.custom-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  min-height: 50px;
  border-radius: 16px;
  background: var(--surface-soft);
  border: 1px solid transparent;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.name-row:focus-within {
  border-color: var(--glass-border);
  background: var(--surface-strong);
}

.name-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 15px;
}

.name-input::placeholder {
  color: var(--text-tertiary);
}

.name-counter {
  flex: none;
  color: var(--text-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.base-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.base-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 4px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: var(--option-bg);
  color: var(--text-secondary);
  font-size: 12px;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.base-option span:first-child {
  font-size: 22px;
  line-height: 1.2;
}

.base-option:hover {
  background: var(--surface-strong);
  color: var(--text-primary);
}

.base-option.selected {
  border-color: var(--option-color);
  background: color-mix(in srgb, var(--option-color) 14%, var(--option-bg));
  color: var(--text-primary);
}

.preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 14px;
}

.preview-emoji {
  font-size: 24px;
  line-height: 1;
}

.preview-name {
  color: var(--text-primary);
  font-weight: 600;
}

.preview-score {
  margin-left: auto;
  font-size: 12px;
}

.form-error {
  margin: -6px 0 0;
  color: var(--danger);
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 2px;
}

@media (max-width: 640px) {
  .base-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
