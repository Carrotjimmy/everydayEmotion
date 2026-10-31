<template>
  <footer class="app-footer">
    <span class="footer-dot" aria-hidden="true"></span>
    <span>数据仅保存在本机 · 建议定期导出备份</span>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
  letter-spacing: 0.02em;
  text-align: center;
}

.footer-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--mood-color);
  opacity: 0.7;
}
</style>
