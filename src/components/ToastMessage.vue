<script setup lang="ts">
defineProps<{
  message: string;
  type: 'success' | 'error' | 'info';
}>();
</script>

<template>
  <Transition name="toast">
    <div
      v-if="message"
      class="toast"
      :class="`is-${type}`"
      :role="type === 'error' ? 'alert' : 'status'"
      aria-live="polite"
    >
      <span class="toast-dot" aria-hidden="true"></span>
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 300;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: min(420px, calc(100vw - 32px));
  padding: 12px 18px;
  transform: translateX(-50%);
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--menu-bg);
  box-shadow: var(--shadow-soft);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.5;
}

.toast-dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--success);
}

.is-error .toast-dot {
  background: var(--danger);
}

.is-info .toast-dot {
  background: var(--focus-ring);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

@media (max-width: 640px) {
  .toast {
    bottom: calc(18px + env(safe-area-inset-bottom));
  }
}
</style>
