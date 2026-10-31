import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// GitHub Pages 项目站点部署在 https://<user>.github.io/<repo>/ 下。
// CI 会通过 VITE_BASE_PATH 传入实际 base_path；本地默认使用相对路径，
// 这样即使直接上传 dist 到任意子路径也能正确加载资源。
const pagesBase = process.env.VITE_BASE_PATH;
const base = pagesBase
  ? pagesBase.endsWith('/')
    ? pagesBase
    : `${pagesBase}/`
  : './';

export default defineConfig({
  plugins: [vue()],
  base,
});
