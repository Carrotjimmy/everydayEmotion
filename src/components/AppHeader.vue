<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const emit = defineEmits<{
  (e: 'export'): void;
  (e: 'import'): void;
}>();

const menuOpen = ref(false);
const menuRoot = ref<HTMLElement | null>(null);
const menuButton = ref<HTMLButtonElement | null>(null);
const firstItem = ref<HTMLButtonElement | null>(null);

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value;
}

function closeMenu(restoreFocus = false): void {
  menuOpen.value = false;
  if (restoreFocus) {
    menuButton.value?.focus();
  }
}

function choose(action: 'export' | 'import'): void {
  closeMenu(true);
  if (action === 'export') {
    emit('export');
  } else {
    emit('import');
  }
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!menuOpen.value) {
    return;
  }
  if (menuRoot.value?.contains(event.target as Node)) {
    return;
  }
  if (document.querySelector('dialog[open]')) {
    return;
  }
  closeMenu();
}

function onKeydown(event: KeyboardEvent): void {
  if (!menuOpen.value) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu(true);
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const items = Array.from(
      menuRoot.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) {
      return;
    }

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + items.length) % items.length;
    items[nextIndex]?.focus();
  }
}

watch(menuOpen, async (open) => {
  if (!open) {
    return;
  }
  await nextTick();
  firstItem.value?.focus();
});

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
});
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <span class="brand-name">everyday<span class="brand-accent">Emotion</span></span>
      <span class="brand-tagline">今天也要好好感受自己</span>
    </div>

    <div ref="menuRoot" class="data-menu" @keydown="onKeydown">
      <button
        ref="menuButton"
        class="icon-button"
        type="button"
        aria-label="数据与备份"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        @click="toggleMenu"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="4" cy="10" r="1.4" fill="currentColor" />
          <circle cx="10" cy="10" r="1.4" fill="currentColor" />
          <circle cx="16" cy="10" r="1.4" fill="currentColor" />
        </svg>
      </button>

      <Transition name="menu">
        <div v-if="menuOpen" class="menu-panel" role="menu" aria-label="数据与备份">
          <button
            ref="firstItem"
            class="menu-item"
            type="button"
            role="menuitem"
            @click="choose('export')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M10 3v9m0 0l3.5-3.5M10 12L6.5 8.5M4 14v2.5h12V14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>导出数据</span>
          </button>
          <button class="menu-item" type="button" role="menuitem" @click="choose('import')">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M10 12V3m0 0L6.5 6.5M10 3l3.5 3.5M4 14v2.5h12V14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>导入数据</span>
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 4px 2px;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-name {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.brand-accent {
  color: var(--text-secondary);
  font-weight: 400;
}

.brand-tagline {
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}

.data-menu {
  position: relative;
  flex: none;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--text-secondary);
  background: var(--surface-soft);
  border: 1px solid transparent;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.icon-button:hover,
.icon-button[aria-expanded='true'] {
  color: var(--text-primary);
  background: var(--surface-strong);
  border-color: var(--glass-border);
}

.icon-button svg {
  width: 20px;
  height: 20px;
}

.menu-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  min-width: 168px;
  padding: 6px;
  border-radius: 18px;
  background: var(--menu-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-soft);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  backdrop-filter: blur(20px) saturate(150%);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  text-align: left;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.menu-item:hover,
.menu-item:focus-visible {
  background: var(--surface-soft);
}

.menu-item svg {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

@media (max-width: 640px) {
  .brand-tagline {
    max-width: 200px;
  }
}
</style>
