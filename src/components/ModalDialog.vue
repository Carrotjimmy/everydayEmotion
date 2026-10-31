<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  title: string;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const titleId = `dialog-title-${Math.random().toString(36).slice(2, 8)}`;

watch(
  () => props.open,
  async (open) => {
    await nextTick();
    const dialog = dialogRef.value;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  },
  { immediate: true },
);

function requestClose(): void {
  emit('close');
}

function onCancel(event: Event): void {
  event.preventDefault();
  requestClose();
}

function onClose(): void {
  if (props.open) {
    requestClose();
  }
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) {
    requestClose();
  }
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="modal"
    :aria-labelledby="titleId"
    @cancel="onCancel"
    @close="onClose"
    @click="onBackdropClick"
  >
    <div class="dialog-card glass-card">
      <header class="dialog-header">
        <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
        <button class="dialog-close" type="button" aria-label="关闭" @click="requestClose">
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
      <div class="dialog-body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="dialog-footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(520px, calc(100vw - 32px));
  max-height: min(86vh, 760px);
  margin: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  overflow: visible;
}

.modal::backdrop {
  background: rgba(15, 15, 18, 0.32);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.dialog-card {
  max-height: min(86vh, 760px);
  padding: 28px;
  overflow: auto;
  background: var(--glass-bg);
  animation: dialog-in var(--duration-base) var(--ease-out);
}

@supports not (backdrop-filter: blur(1px)) {
  .dialog-card {
    background: var(--glass-fallback);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dialog-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.dialog-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-secondary);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.dialog-close:hover {
  background: var(--surface-strong);
  color: var(--text-primary);
}

.dialog-close svg {
  width: 18px;
  height: 18px;
}

.dialog-body {
  margin-top: 18px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 26px;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 640px) {
  .dialog-card {
    padding: 22px;
  }
}
</style>
