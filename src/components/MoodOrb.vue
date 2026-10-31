<script setup lang="ts">
import { ref } from 'vue';
import type { MoodSelection } from '../types/mood';

defineProps<{
  mood: MoodSelection | null;
  expanded: boolean;
}>();

const emit = defineEmits<{ (e: 'open'): void }>();
const buttonRef = ref<HTMLButtonElement | null>(null);

function focus(): void {
  buttonRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <button
    ref="buttonRef"
    class="mood-orb-button"
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="expanded"
    :aria-label="mood ? `当前心情：${mood.name}，点击更换` : '选择今天的心情'"
    @click="emit('open')"
  >
    <span class="orb" :class="{ 'has-mood': Boolean(mood) }" aria-hidden="true">
      <span class="orb-shine"></span>
      <span class="orb-emoji">{{ mood?.emoji ?? '＋' }}</span>
    </span>
    <span class="orb-copy">
      <span class="orb-name">{{ mood?.name ?? '今天感觉怎么样？' }}</span>
      <span class="orb-hint">{{ mood ? '点击更换心情' : '选择一个情绪' }}</span>
    </span>
    <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 6l4.5 4.5L12.5 6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.mood-orb-button {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  padding: 10px 18px 10px 10px;
  border-radius: 999px;
  background: var(--surface-soft);
  border: 1px solid var(--glass-border);
  transition:
    transform var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.mood-orb-button:hover {
  transform: translateY(-1px);
  background: var(--surface-strong);
}

.mood-orb-button:active {
  transform: scale(0.985);
}

.orb {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.55), transparent 55%),
    var(--surface-strong);
  box-shadow:
    0 0 0 1px var(--glass-border),
    0 18px 40px var(--mood-glow);
  transition:
    box-shadow var(--duration-slow) var(--ease-out),
    background var(--duration-slow) var(--ease-out);
}

.orb.has-mood {
  box-shadow:
    0 0 0 1px var(--mood-color),
    0 18px 50px var(--mood-glow);
}

.orb-shine {
  position: absolute;
  inset: 8px;
  border-radius: inherit;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4), transparent 50%);
  pointer-events: none;
}

.orb-emoji {
  position: relative;
  font-size: 44px;
  line-height: 1;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.12));
}

.orb-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  text-align: left;
}

.orb-name {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.orb-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.chevron {
  width: 16px;
  height: 16px;
  margin-left: 4px;
  color: var(--text-tertiary);
}

@media (max-width: 640px) {
  .mood-orb-button {
    width: 100%;
    justify-content: center;
    gap: 14px;
    padding: 12px;
  }

  .orb {
    width: 84px;
    height: 84px;
  }

  .orb-emoji {
    font-size: 38px;
  }
}
</style>
