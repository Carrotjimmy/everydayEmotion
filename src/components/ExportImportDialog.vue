<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';
import type { BackupPreview, ImportMode } from '../types/backup';
import { formatDateTime } from '../utils/date';

const props = defineProps<{
  open: boolean;
  preview: BackupPreview | null;
  errorMessage: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', mode: ImportMode): void;
}>();

const mode = ref<ImportMode>('merge');

watch(
  () => props.open,
  (open) => {
    if (open) {
      mode.value = 'merge';
    }
  },
);

function rangeText(preview: BackupPreview): string {
  if (!preview.firstDate || !preview.lastDate) {
    return '无记录';
  }
  if (preview.firstDate === preview.lastDate) {
    return preview.firstDate;
  }
  return `${preview.firstDate} 至 ${preview.lastDate}`;
}
</script>

<template>
  <ModalDialog :open="open" title="导入备份" @close="emit('close')">
    <div v-if="preview" class="import-body">
      <div class="file-card">
        <p class="file-name">{{ preview.fileName }}</p>
        <dl class="file-meta">
          <div>
            <dt>导出时间</dt>
            <dd>{{ formatDateTime(preview.exportedAt) }}</dd>
          </div>
          <div>
            <dt>记录</dt>
            <dd>{{ preview.recordCount }} 条 · {{ rangeText(preview) }}</dd>
          </div>
          <div>
            <dt>自定义情绪</dt>
            <dd>{{ preview.customMoodCount }} 个</dd>
          </div>
        </dl>
      </div>

      <div class="mode-list" role="radiogroup" aria-label="导入方式">
        <label class="mode-option" :class="{ selected: mode === 'merge' }">
          <input v-model="mode" type="radio" value="merge" />
          <span class="mode-copy">
            <strong>合并导入</strong>
            <small>保留两边记录，同一天以较新的为准</small>
          </span>
        </label>
        <label class="mode-option" :class="{ selected: mode === 'replace' }">
          <input v-model="mode" type="radio" value="replace" />
          <span class="mode-copy">
            <strong>覆盖导入</strong>
            <small>用备份文件替换本机全部记录与自定义情绪</small>
          </span>
        </label>
      </div>

      <p class="warning">
        导入会修改本机数据，当前未保存的输入将丢失。
        <template v-if="mode === 'replace' && preview.recordCount === 0">
          备份中没有记录，覆盖后会清空本机全部记录。
        </template>
      </p>

      <p v-if="errorMessage" class="import-error" role="alert">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <button class="btn btn-secondary" type="button" @click="emit('close')">
        取消
      </button>
      <button
        class="btn"
        :class="mode === 'replace' ? 'btn-danger' : 'btn-primary'"
        type="button"
        @click="emit('confirm', mode)"
      >
        导入
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.import-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.file-card {
  padding: 16px;
  border-radius: 16px;
  background: var(--surface-soft);
}

.file-name {
  margin: 0 0 12px;
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 600;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.file-meta div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
}

.file-meta dt {
  color: var(--text-tertiary);
}

.file-meta dd {
  margin: 0;
  color: var(--text-secondary);
  text-align: right;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  background: var(--option-bg);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.mode-option:hover {
  background: var(--surface-strong);
}

.mode-option.selected {
  border-color: var(--focus-ring);
  background: var(--surface-strong);
}

.mode-option input {
  margin-top: 2px;
  accent-color: var(--focus-ring);
}

.mode-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mode-copy strong {
  font-size: 14px;
  font-weight: 600;
}

.mode-copy small {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.warning {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.65;
}

.import-error {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
  line-height: 1.6;
}
</style>
