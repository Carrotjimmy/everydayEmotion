<script setup lang="ts">
defineProps<{
  disabled: boolean;
  updating: boolean;
  accent: string | null;
}>();

const emit = defineEmits<{ (e: 'save'): void }>();
</script>

<template>
  <div class="save-area">
    <button
      class="save-button"
      type="button"
      :disabled="disabled"
      :aria-describedby="disabled ? 'save-hint' : undefined"
      @click="emit('save')"
    >
      <span
        v-if="accent"
        class="save-dot"
        :style="{ background: accent }"
        aria-hidden="true"
      ></span>
      <span class="save-label">{{ updating ? '更新今天的记录' : '保存今天的记录' }}</span>
      <span class="save-arrow" aria-hidden="true">→</span>
    </button>
    <p v-if="disabled" id="save-hint" class="save-hint">先选一个心情吧</p>
  </div>
</template>

<style scoped>
.save-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 54px;
  padding: 0 28px;
  border-radius: 999px;
  background: var(--text-primary);
  color: var(--bg-base);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  box-shadow: 0 12px 30px rgba(29, 29, 31, 0.16);
  transition:
    transform var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.save-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 36px rgba(29, 29, 31, 0.22);
}

.save-button:active:not(:disabled) {
  transform: scale(0.985);
}

.save-button:disabled {
  opacity: 0.38;
  box-shadow: none;
}

.save-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.save-arrow {
  font-size: 16px;
  opacity: 0.7;
}

.save-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

@media (prefers-color-scheme: dark) {
  .save-button {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  }
}
</style>
