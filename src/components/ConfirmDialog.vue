<script setup lang="ts">
import ModalDialog from './ModalDialog.vue';

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    confirmText: '确认',
    cancelText: '取消',
    danger: false,
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();
</script>

<template>
  <ModalDialog :open="open" :title="title" @close="emit('close')">
    <p class="confirm-message">{{ message }}</p>
    <template #footer>
      <button class="btn btn-secondary" type="button" @click="emit('close')">
        {{ cancelText }}
      </button>
      <button
        class="btn"
        :class="danger ? 'btn-danger' : 'btn-primary'"
        type="button"
        @click="emit('confirm')"
      >
        {{ confirmText }}
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.confirm-message {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-line;
}
</style>
