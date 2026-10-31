# everydayEmotion

每天记录一次心情的纯前端小工具。数据只保存在浏览器 localStorage，不上传、不联网。

技术栈：**Vite + Vue 3 + TypeScript**。

## 当前进度

已完成 MVP：

- 7 个预设情绪 + 自定义情绪（创建、删除、选择池持久化）
- 多行备注（200 字上限）、今日记录回显、覆盖确认
- localStorage 版本化，包含损坏数据备份、配额异常与隐私模式降级
- JSON 备份导出 / 导入：合并或覆盖、完整校验、导入前快照、非法文件整包拒绝
- 浅色 / 跟随系统深色、玻璃质感、情绪色光晕、响应式与键盘可访问

P1 待实现：

- ECharts 情绪曲线（7 / 14 / 30 天）
- 自定义情绪编辑
- 保存成功撒花、按钮微交互、Web Audio 音效与静音
- 更完整的设计走查与可访问性打磨

完整需求见 [需求文档.md](./需求文档.md)。

## 开发

```bash
npm install
npm run dev        # 启动开发服务器
npm run type-check # TypeScript 类型检查
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览生产构建
```

## 部署到 GitHub Pages

已包含工作流 [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)，推送到 `main` 分支会自动构建并部署。

首次部署需要完成：

1. 在 GitHub 创建仓库，将本项目推送到 `main` 分支。
2. 打开仓库 **Settings → Pages**，把 **Build and deployment → Source** 设为 **GitHub Actions**。
3. 推送到 `main`，或在 **Actions** 页面手动运行 `Deploy to GitHub Pages`。
4. 部署完成后访问 `https://<username>.github.io/<repo>/`。

注意事项：

- **路径**：工作流会读取 `actions/configure-pages` 输出的 `base_path`，通过 `VITE_BASE_PATH` 注入构建。项目站点自动使用 `/<repo>/`，用户站点或自定义域名使用 `/`，本地构建默认使用相对路径 `./`，无需手动改仓库名。
- **Pages 未启用时**：`configure-pages` 会失败。`GITHUB_TOKEN` 无权自动启用 Pages，需按上面第 2 步手动设置。
- **仓库可见性**：GitHub Free 的 Pages 通常要求仓库为 public；私有仓库需要当前计划支持 Pages。
- **分支名**：工作流监听 `main`。若默认分支是 `master`，请同步修改 `.github/workflows/deploy.yml` 中的 `branches`。
- **localStorage 与域名**：数据按“源（origin）”隔离。换自定义域名、换 GitHub 用户名或换浏览器后，原数据不会自动带过去；请使用应用内的导出 / 导入备份迁移。
- **前端路由**：当前应用没有客户端路由，不需要额外的 `404.html` 回退。若以后加入 Vue Router 的 history 模式，需要配置 SPA 回退，或改用 hash 模式。
- **无需 `.nojekyll`**：使用 Actions 上传 `dist` 静态产物，不经过 Jekyll 处理。

## 目录

```text
src/
├── components/    # 页面组件与弹窗
├── composables/   # 状态、备份导入导出
├── constants/     # 情绪预设、存储键、限制值
├── styles/        # 设计 token 与基础样式
├── types/         # TypeScript 类型
└── utils/         # 日期、存储、校验、备份、文本工具
```

## 数据

| 键名 | 内容 |
| --- | --- |
| `everyday-emotion:v1` | 每日记录与自定义情绪 |
| `everyday-emotion:prefs:v1` | 用户偏好 |
| `everyday-emotion:pre-import-backup` | 最近一次导入前的本机快照 |
| `everyday-emotion:corrupt-backup:<timestamp>` | 数据损坏时的原始备份 |

备份文件的导出格式与校验规则见需求文档附录 C。
