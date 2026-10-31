<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { MAX_NOTE_LENGTH } from '../constants/app';
import { charCount, trimToChars } from '../utils/text';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const atLimit = ref(false);
const counterId = `note-counter-${Math.random().toString(36).slice(2, 8)}`;

function autosize(): void {
  const el = textareaRef.value;
  if (!el) {
    return;
  }

  el.style.height = 'auto';
  const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 25.5;
  const maxHeight = lineHeight * 6 + 28;
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function onInput(event: Event): void {
  const el = event.target as HTMLTextAreaElement;
  const raw = el.value;
  const clamped = trimToChars(raw, MAX_NOTE_LENGTH);

  if (clamped !== raw) {
    el.value = clamped;
  }

  atLimit.value = charCount(clamped) >= MAX_NOTE_LENGTH;
  emit('update:modelValue', clamped);
  autosize();
}

watch(
  () => props.modelValue,
  () => {
    atLimit.value = charCount(props.modelValue) >= MAX_NOTE_LENGTH;
    void nextTick(autosize);
  },
);

onMounted(() => {
  atLimit.value = charCount(props.modelValue) >= MAX_NOTE_LENGTH;
  void nextTick(autosize);
});
</script>

<template>
  <div class="note-field">
    <label for="note-input" class="sr-only">今天的备注</label>
    <textarea
      id="note-input"
      ref="textareaRef"
      class="note-input"
      :value="modelValue"
      :aria-describedby="counterId"
      placeholder="今天发生了什么？想说点什么吗"
      rows="3"
      @input="onInput"
    ></textarea>
    <div class="note-meta">
      <span v-if="atLimit" class="note-limit">最多 {{ MAX_NOTE_LENGTH }} 个字符</span>
      <span :id="counterId" class="note-counter" aria-live="polite">
        {{ charCount(modelValue) }} / {{ MAX_NOTE_LENGTH }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.note-field {
  position: relative;
  border-radius: 20px;
  background: var(--surface-soft);
  border: 1px solid transparent;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.note-field:focus-within {
  border-color: var(--glass-border);
  background: var(--surface-strong);
}

.note-input {
  display: block;
  width: 100%;
  min-height: 108px;
  padding: 18px 20px 8px;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  line-height: 1.7;
  font-size: 15px;
}

.note-input::placeholder {
  color: var(--text-tertiary);
}

.note-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 0 20px 14px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.note-limit {
  color: var(--danger);
}

.note-counter {
  font-variant-numeric: tabular-nums;
}
</style>
