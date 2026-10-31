<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import CustomMoodForm from './components/CustomMoodForm.vue';
import ExportImportDialog from './components/ExportImportDialog.vue';
import GlassCard from './components/GlassCard.vue';
import MoodOrb from './components/MoodOrb.vue';
import MoodPicker from './components/MoodPicker.vue';
import NoteInput from './components/NoteInput.vue';
import SaveButton from './components/SaveButton.vue';
import ToastMessage from './components/ToastMessage.vue';
import { TOAST_DURATION_MS } from './constants/app';
import type { ParsedBackup } from './composables/useDataTransfer';
import { parseBackupFile } from './composables/useDataTransfer';
import { useMoodStore } from './composables/useMoodStore';
import type { BackupPreview, ImportMode } from './types/backup';
import type { CustomMood, MoodPresetId, MoodSelection } from './types/mood';
import { hexToRgba } from './utils/color';
import { formatDisplayDate } from './utils/date';

const store = useMoodStore();

const selectedMood = ref<MoodSelection | null>(null);
const note = ref('');
const displayDate = ref(formatDisplayDate());

const pickerOpen = ref(false);
const moodAnchor = ref<HTMLElement | null>(null);

const customFormOpen = ref(false);
const customFormError = ref('');

const deleteDialogOpen = ref(false);
const deleteTarget = ref<CustomMood | null>(null);

const overwriteOpen = ref(false);

const importDialogOpen = ref(false);
const importError = ref('');
const pendingImport = ref<ParsedBackup | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'info'>('success');
let toastTimer: number | undefined;

const todayRecord = store.todayRecord;
const customMoods = store.customMoods;
const isUpdating = computed(() => Boolean(todayRecord.value));

const themeStyle = computed<Record<string, string>>(() => {
  const accent = selectedMood.value?.color ?? '#C7B9A8';
  return {
    '--mood-color': accent,
    '--mood-glow': hexToRgba(accent, selectedMood.value ? 0.2 : 0.1),
    '--mood-glow-soft': hexToRgba(accent, selectedMood.value ? 0.1 : 0.05),
  };
});

const overwriteMessage = computed(() => {
  const record = todayRecord.value;
  if (!record) {
    return '';
  }

  const noteText = record.note.replace(/\s+/g, ' ').trim();
  const notePreview = noteText
    ? `\n备注：${noteText.length > 40 ? `${noteText.slice(0, 40)}…` : noteText}`
    : '';

  return `要覆盖今天的记录吗？\n当前：${record.emoji} ${record.moodName}${notePreview}`;
});

const deleteMessage = computed(() => {
  const mood = deleteTarget.value;
  if (!mood) {
    return '';
  }
  return `删除「${mood.name}」？\n已保存的历史记录不会受影响。`;
});

const importPreview = computed<BackupPreview | null>(
  () => pendingImport.value?.preview ?? null,
);

function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'success',
): void {
  toastMessage.value = message;
  toastType.value = type;

  if (toastTimer !== undefined) {
    window.clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    toastMessage.value = '';
    toastTimer = undefined;
  }, TOAST_DURATION_MS);
}

function syncFromToday(): void {
  const record = todayRecord.value;
  if (record) {
    selectedMood.value = store.selectionFromRecord(record);
    note.value = record.note;
  } else {
    selectedMood.value = null;
    note.value = '';
  }
  displayDate.value = formatDisplayDate();
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'visible') {
    return;
  }

  const changed = store.refreshTodayKey();
  if (changed) {
    syncFromToday();
  } else {
    displayDate.value = formatDisplayDate();
  }
}

function openPicker(): void {
  pickerOpen.value = true;
}

function closePicker(): void {
  pickerOpen.value = false;
}

function selectMood(mood: MoodSelection): void {
  selectedMood.value = mood;
  pickerOpen.value = false;
}

function openCustomForm(): void {
  customFormError.value = '';
  customFormOpen.value = true;
}

function closeCustomForm(): void {
  customFormOpen.value = false;
  customFormError.value = '';
}

function clearCustomFormError(): void {
  customFormError.value = '';
}

function addCustomMood(payload: { name: string; baseId: MoodPresetId }): void {
  const result = store.addCustomMood(payload.name, payload.baseId);
  if (!result.ok) {
    customFormError.value = result.error;
    return;
  }

  customFormOpen.value = false;
  pickerOpen.value = false;
  selectedMood.value = store.selectionFromCustom(result.value.mood);
  showToast('已添加自定义情绪');
}

function requestDelete(mood: CustomMood): void {
  deleteTarget.value = mood;
  deleteDialogOpen.value = true;
}

function closeDeleteDialog(): void {
  deleteDialogOpen.value = false;
  deleteTarget.value = null;
}

function confirmDelete(): void {
  const mood = deleteTarget.value;
  if (!mood) {
    return;
  }

  const result = store.removeCustomMood(mood.id);
  if (!result.ok) {
    showToast(result.error, 'error');
    closeDeleteDialog();
    return;
  }

  const isTodayRecord = todayRecord.value?.moodId === mood.id;
  if (selectedMood.value?.id === mood.id && !isTodayRecord) {
    selectedMood.value = null;
    showToast('已删除，重新选一个心情吧', 'info');
  } else {
    showToast('已删除自定义情绪');
  }

  closeDeleteDialog();
}

function requestSave(): void {
  if (!selectedMood.value) {
    return;
  }

  if (todayRecord.value) {
    overwriteOpen.value = true;
    return;
  }

  saveNow();
}

function saveNow(): void {
  const mood = selectedMood.value;
  if (!mood) {
    return;
  }

  const result = store.saveTodayRecord(mood, note.value);
  if (!result.ok) {
    overwriteOpen.value = false;
    showToast(result.error, 'error');
    return;
  }

  note.value = result.value.record.note;
  overwriteOpen.value = false;
  showToast('已记录今天的心情');
}

function closeOverwrite(): void {
  overwriteOpen.value = false;
}

function handleExport(): void {
  const result = store.exportBackup();
  if (!result.ok) {
    showToast(result.error, 'error');
    return;
  }
  showToast('备份已导出');
}

function handleImport(): void {
  const input = fileInputRef.value;
  if (!input) {
    return;
  }
  input.value = '';
  input.click();
}

async function onFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (!file) {
    return;
  }

  const result = await parseBackupFile(file);
  if (!result.ok) {
    showToast(result.error, 'error');
    return;
  }

  pendingImport.value = result.value;
  importError.value = '';
  importDialogOpen.value = true;
}

function closeImportDialog(): void {
  importDialogOpen.value = false;
  importError.value = '';
  pendingImport.value = null;
}

function confirmImport(mode: ImportMode): void {
  const pending = pendingImport.value;
  if (!pending) {
    return;
  }

  const result = store.importBackup(pending.file, mode);
  if (!result.ok) {
    importError.value = result.error;
    return;
  }

  importDialogOpen.value = false;
  importError.value = '';
  pendingImport.value = null;
  syncFromToday();

  const label = mode === 'merge' ? '已合并' : '已导入';
  showToast(`${label} ${result.value.recordCount} 条记录`);
}

onMounted(() => {
  store.refreshTodayKey();
  syncFromToday();

  const firstIssue = store.state.issues[0];
  if (firstIssue) {
    showToast(firstIssue, 'error');
    store.clearIssues();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (toastTimer !== undefined) {
    window.clearTimeout(toastTimer);
  }
});
</script>

<template>
  <div class="app-shell" :style="themeStyle">
    <div class="ambient" aria-hidden="true">
      <span class="glow glow-a"></span>
      <span class="glow glow-b"></span>
      <span class="glow glow-c"></span>
    </div>

    <div class="page">
      <AppHeader @export="handleExport" @import="handleImport" />

      <main class="main">
        <GlassCard class="checkin-card">
          <div class="date-row">
            <p class="date-display">{{ displayDate }}</p>
            <span class="date-dot" aria-hidden="true"></span>
          </div>

          <div class="mood-section">
            <div ref="moodAnchor" class="mood-anchor">
              <MoodOrb
                :mood="selectedMood"
                :expanded="pickerOpen"
                @open="openPicker"
              />
            </div>
          </div>

          <NoteInput v-model="note" />

          <div class="save-row">
            <SaveButton
              :disabled="!selectedMood"
              :updating="isUpdating"
              :accent="selectedMood?.color ?? null"
              @save="requestSave"
            />
          </div>
        </GlassCard>
      </main>

      <AppFooter />
    </div>

    <MoodPicker
      :open="pickerOpen"
      :anchor="moodAnchor"
      :presets="store.presets"
      :custom-moods="customMoods"
      :selected-id="selectedMood?.id ?? null"
      @close="closePicker"
      @select="selectMood"
      @add-custom="openCustomForm"
      @delete-custom="requestDelete"
    />

    <CustomMoodForm
      :open="customFormOpen"
      :custom-moods="customMoods"
      :error-message="customFormError"
      @close="closeCustomForm"
      @clear-error="clearCustomFormError"
      @submit="addCustomMood"
    />

    <ConfirmDialog
      :open="overwriteOpen"
      title="今天已经记录过了"
      :message="overwriteMessage"
      confirm-text="覆盖"
      @close="closeOverwrite"
      @confirm="saveNow"
    />

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="删除自定义情绪"
      :message="deleteMessage"
      confirm-text="删除"
      danger
      @close="closeDeleteDialog"
      @confirm="confirmDelete"
    />

    <ExportImportDialog
      :open="importDialogOpen"
      :preview="importPreview"
      :error-message="importError"
      @close="closeImportDialog"
      @confirm="confirmImport"
    />

    <ToastMessage :message="toastMessage" :type="toastType" />

    <input
      ref="fileInputRef"
      class="sr-only"
      type="file"
      accept=".json,application/json"
      tabindex="-1"
      aria-hidden="true"
      @change="onFileSelected"
    />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  overflow: clip;
  background: var(--bg-base);
  transition: background-color var(--duration-slow) var(--ease-out);
}

.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.glow {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, var(--mood-glow) 0%, transparent 68%);
  filter: blur(40px);
  transition: background var(--duration-slow) var(--ease-out);
  animation: drift 16s ease-in-out infinite alternate;
}

.glow-a {
  top: -20%;
  left: -12%;
  width: 64vw;
  height: 64vw;
  max-width: 760px;
  max-height: 760px;
}

.glow-b {
  right: -14%;
  bottom: -16%;
  width: 52vw;
  height: 52vw;
  max-width: 620px;
  max-height: 620px;
  background: radial-gradient(circle, var(--mood-glow-soft) 0%, transparent 70%);
  animation-delay: -6s;
}

.glow-c {
  top: 28%;
  right: 18%;
  width: 24vw;
  height: 24vw;
  max-width: 300px;
  max-height: 300px;
  background: radial-gradient(circle, var(--mood-glow-soft) 0%, transparent 72%);
  animation-delay: -11s;
}

.page {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: var(--content-width);
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px 24px 40px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.checkin-card {
  padding: var(--card-padding-desktop);
  animation: card-in var(--duration-slow) var(--ease-out);
}

.date-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.date-display {
  margin: 0;
  font-size: clamp(36px, 6vw, 56px);
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.date-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--mood-color);
  opacity: 0.8;
}

.mood-section {
  display: flex;
  justify-content: center;
  margin: 8px 0 28px;
}

.mood-anchor {
  position: relative;
  display: inline-flex;
  max-width: 100%;
}

.save-row {
  margin-top: 24px;
}

@keyframes drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(4%, -3%, 0) scale(1.08);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .page {
    gap: 18px;
    padding: 20px 16px calc(28px + env(safe-area-inset-bottom));
  }

  .checkin-card {
    padding: var(--card-padding-mobile);
    border-radius: 24px;
  }

  .date-row {
    margin-bottom: 22px;
  }

  .date-display {
    font-size: clamp(28px, 8.4vw, 40px);
  }

  .mood-section {
    margin: 4px 0 22px;
  }

  .mood-anchor {
    width: 100%;
  }
}
</style>
