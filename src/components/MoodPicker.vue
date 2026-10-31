<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import type { CustomMood, MoodPreset, MoodSelection } from '../types/mood';

const props = defineProps<{
  open: boolean;
  anchor: HTMLElement | null;
  presets: readonly MoodPreset[];
  customMoods: readonly CustomMood[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', mood: MoodSelection): void;
  (e: 'add-custom'): void;
  (e: 'delete-custom', mood: CustomMood): void;
}>();

const panelRef = ref<HTMLElement | null>(null);
const panelStyle = ref<CSSProperties>({});
const isMobile = ref(false);
const mobileQuery = window.matchMedia('(max-width: 640px)');

let previousFocus: HTMLElement | null = null;
let previousOverflow = '';

function updatePosition(): void {
  if (!props.open) {
    return;
  }

  isMobile.value = mobileQuery.matches;
  if (isMobile.value) {
    panelStyle.value = {};
    return;
  }

  const anchor = props.anchor;
  if (!anchor) {
    return;
  }

  const rect = anchor.getBoundingClientRect();
  const width = Math.min(420, window.innerWidth - 32);
  const panelHeight = panelRef.value?.offsetHeight ?? 380;
  const halfWidth = width / 2;

  let left = rect.left + rect.width / 2;
  left = Math.max(16 + halfWidth, Math.min(left, window.innerWidth - 16 - halfWidth));

  let top = rect.bottom + 12;
  if (top + panelHeight > window.innerHeight - 16) {
    top = Math.max(16, rect.top - panelHeight - 12);
  }

  panelStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

function onMobileChange(): void {
  updatePosition();
}

async function focusInitial(): Promise<void> {
  await nextTick();
  const panel = panelRef.value;
  if (!panel) {
    return;
  }

  const selected = panel.querySelector<HTMLElement>(
    '[data-mood-option][aria-checked="true"]',
  );
  const first = panel.querySelector<HTMLElement>('[data-mood-option]');
  (selected ?? first ?? panel.querySelector<HTMLElement>('button'))?.focus();
}

function cleanup(): void {
  window.removeEventListener('resize', updatePosition);
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeydown, true);
  document.body.style.overflow = previousOverflow;
  panelStyle.value = {};
}

function onDocumentPointerDown(event: PointerEvent): void {
  const target = event.target as Node;
  if (panelRef.value?.contains(target)) {
    return;
  }
  if (props.anchor?.contains(target)) {
    return;
  }
  if (document.querySelector('dialog[open]')) {
    return;
  }
  emit('close');
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') {
    return;
  }
  if (document.querySelector('dialog[open]')) {
    return;
  }
  event.preventDefault();
  emit('close');
}

function getFocusable(): HTMLElement[] {
  const panel = panelRef.value;
  if (!panel) {
    return [];
  }

  return Array.from(
    panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab') {
    const focusables = getFocusable();
    if (focusables.length === 0) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
    return;
  }

  if (
    event.key === 'ArrowRight' ||
    event.key === 'ArrowDown' ||
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowUp'
  ) {
    const options = Array.from(
      panelRef.value?.querySelectorAll<HTMLElement>('[data-mood-option]') ?? [],
    );
    if (options.length === 0) {
      return;
    }

    const index = options.findIndex((option) => option === document.activeElement);
    if (index === -1) {
      return;
    }

    event.preventDefault();
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (index + direction + options.length) % options.length;
    options[nextIndex]?.focus();
  }
}

function selectPreset(preset: MoodPreset): void {
  emit('select', {
    id: preset.id,
    name: preset.name,
    emoji: preset.emoji,
    score: preset.score,
    color: preset.color,
    isCustom: false,
  });
}

function selectCustom(mood: CustomMood): void {
  emit('select', {
    id: mood.id,
    name: mood.name,
    emoji: mood.emoji,
    score: mood.score,
    color: mood.color,
    isCustom: true,
  });
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      isMobile.value = mobileQuery.matches;
      await nextTick();
      updatePosition();
      await focusInitial();
      window.addEventListener('resize', updatePosition);
      document.addEventListener('pointerdown', onDocumentPointerDown, true);
      document.addEventListener('keydown', onDocumentKeydown, true);
    } else {
      cleanup();
      previousFocus?.focus();
      previousFocus = null;
    }
  },
);

onMounted(() => {
  mobileQuery.addEventListener('change', onMobileChange);
});

onBeforeUnmount(() => {
  mobileQuery.removeEventListener('change', onMobileChange);
  cleanup();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="picker-layer">
      <div class="picker-overlay" @click="emit('close')"></div>

      <section
        ref="panelRef"
        class="picker-panel"
        :class="{ 'is-mobile': isMobile }"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mood-picker-title"
        @keydown="onKeydown"
      >
        <header class="picker-header">
          <div>
            <h2 id="mood-picker-title" class="picker-title">今天感觉怎么样？</h2>
            <p class="picker-subtitle">选一个最接近此刻的感受</p>
          </div>
          <button
            class="picker-close"
            type="button"
            aria-label="关闭心情选择"
            @click="emit('close')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>

        <div class="mood-grid" role="radiogroup" aria-labelledby="mood-picker-title">
          <button
            v-for="preset in presets"
            :key="preset.id"
            class="mood-option"
            type="button"
            role="radio"
            :aria-checked="selectedId === preset.id"
            :aria-label="`${preset.name}，${preset.score} 分`"
            data-mood-option
            :style="{ '--option-color': preset.color }"
            @click="selectPreset(preset)"
          >
            <span class="mood-emoji" aria-hidden="true">{{ preset.emoji }}</span>
            <span class="mood-name">{{ preset.name }}</span>
            <span v-if="selectedId === preset.id" class="mood-check" aria-hidden="true">
              ✓
            </span>
          </button>
        </div>

        <template v-if="customMoods.length > 0">
          <p class="section-label">我的</p>
          <div class="mood-grid" role="radiogroup" aria-label="我的自定义情绪">
            <div
              v-for="mood in customMoods"
              :key="mood.id"
              class="custom-option"
            >
              <button
                class="mood-option"
                type="button"
                role="radio"
                :aria-checked="selectedId === mood.id"
                :aria-label="`${mood.name}，${mood.score} 分`"
                data-mood-option
                :style="{ '--option-color': mood.color }"
                @click="selectCustom(mood)"
              >
                <span class="mood-emoji" aria-hidden="true">{{ mood.emoji }}</span>
                <span class="mood-name">{{ mood.name }}</span>
                <span
                  v-if="selectedId === mood.id"
                  class="mood-check"
                  aria-hidden="true"
                >
                  ✓
                </span>
              </button>
              <button
                class="delete-mood"
                type="button"
                :aria-label="`删除自定义情绪 ${mood.name}`"
                @click.stop="emit('delete-custom', mood)"
              >
                ×
              </button>
            </div>
          </div>
        </template>

        <button class="add-custom" type="button" @click="emit('add-custom')">
          <span aria-hidden="true">＋</span>
          自定义情绪
        </button>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.picker-layer {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.picker-overlay {
  position: absolute;
  inset: 0;
  background: transparent;
}

.picker-panel {
  position: fixed;
  z-index: 101;
  max-height: calc(100vh - 32px);
  padding: 22px;
  overflow-y: auto;
  border-radius: 24px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow);
  -webkit-backdrop-filter: blur(28px) saturate(150%);
  backdrop-filter: blur(28px) saturate(150%);
  transform: translateX(-50%);
  animation: picker-in var(--duration-base) var(--ease-out);
}

@supports not (backdrop-filter: blur(1px)) {
  .picker-panel {
    background: var(--glass-fallback);
  }
}

.picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.picker-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.picker-subtitle {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
}

.picker-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 50%;
  color: var(--text-secondary);
  background: var(--surface-soft);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.picker-close:hover {
  background: var(--surface-strong);
  color: var(--text-primary);
}

.picker-close svg {
  width: 18px;
  height: 18px;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mood-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 78px;
  padding: 12px 6px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: var(--option-bg);
  color: var(--text-primary);
  transition:
    transform var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.mood-option:hover {
  transform: translateY(-1px);
  background: var(--surface-strong);
}

.mood-option[aria-checked='true'] {
  border-color: var(--option-color);
  background: color-mix(in srgb, var(--option-color) 14%, var(--option-bg));
  box-shadow: 0 8px 24px color-mix(in srgb, var(--option-color) 18%, transparent);
}

.mood-emoji {
  font-size: 28px;
  line-height: 1;
}

.mood-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.mood-option[aria-checked='true'] .mood-name {
  color: var(--text-primary);
  font-weight: 600;
}

.mood-check {
  position: absolute;
  top: 7px;
  right: 9px;
  color: var(--option-color);
  font-size: 11px;
  font-weight: 700;
}

.section-label {
  margin: 18px 0 10px;
  color: var(--text-tertiary);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.custom-option {
  position: relative;
}

.custom-option .mood-option {
  width: 100%;
}

.delete-mood {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--menu-bg);
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1;
  opacity: 0;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.custom-option:hover .delete-mood,
.delete-mood:focus-visible {
  opacity: 1;
}

.delete-mood:hover {
  color: var(--danger);
}

.add-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 46px;
  margin-top: 14px;
  border-radius: 16px;
  border: 1px dashed var(--glass-border);
  color: var(--text-secondary);
  font-size: 13px;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.add-custom:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}

.is-mobile {
  top: auto !important;
  right: 0;
  bottom: 0;
  left: 0 !important;
  width: auto !important;
  max-height: 82vh;
  padding-bottom: calc(22px + env(safe-area-inset-bottom));
  border-radius: 26px 26px 0 0;
  transform: none;
  animation: sheet-in var(--duration-base) var(--ease-out);
}

@keyframes picker-in {
  from {
    opacity: 0;
    transform: translate(-50%, 6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

@keyframes sheet-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .picker-overlay {
    background: var(--overlay-bg);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
  }

  .mood-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .mood-option {
    min-height: 72px;
  }

  .delete-mood {
    opacity: 1;
  }
}
</style>
