# 泥孩谜题 · Muddy Children Lab

一个支持中文和英文的泥孩谜题交互网页，可配置孩子数量和泥巴分布，并逐轮查看克里普克模型的更新。

A bilingual interactive muddy children puzzle with configurable scenarios and step-by-step Kripke model updates.

## GitHub Pages 发布

1. 将本目录中的文件放在公开仓库的 `main` 分支根目录。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择 `main` 和 `/(root)`，点击 **Save**。
5. 等待发布完成，通过页面显示的 **Visit site** 打开网站。

首页是 `index.html`；无需安装依赖或运行构建。`.nojekyll` 文件用于直接提供静态文件。

## 使用

- 点击孩子可切换是否有泥巴，并回到初始完整模型。
- 使用上一步和下一步查看公开回应带来的知识变化。
- 模型支持放大查看，放大后也可切换步骤。
- 所有模拟状态都在浏览器本地处理，可通过网页内的分享功能保存当前情形。

网页运行无需外部字体、图片或脚本服务；页脚的教材链接仅在点击后访问外部网站。
