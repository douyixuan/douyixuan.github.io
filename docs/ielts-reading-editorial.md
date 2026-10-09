# Daily IELTS Reading 发布约定

- 仓库 douyixuan/douyixuan.github.io，发布分支 **master**（不是 main）。现有 Pages workflow 在 master push 后构建部署；它不负责生成文章。ChatGPT 输出不是博客发布。
- 每天中午 Asia/Shanghai 精选一篇可免费、免登录阅读全文的英文文章，核实标题、作者、日期与原文 URL；不选 Scientific American 等付费来源，不转载全文。
- 每篇独立保存为 `content/posts/ielts-reading/YYYY-MM-DD.md`。运行前检查当日文件及原文 URL，避免重复。只补本次必要内容，不批量补历史。
- 延续栏目格式：原文卡片、简短导读、词汇、五道阅读理解题、逐题参考答案、可积累表达。每道题后使用 `{{< answer >}}` 与 `{{< /answer >}}`，答案依据原文核对，禁止省略。
- front matter 使用 `categories: ["ielts-reading"]`、`series: ["Daily IELTS Reading"]`、`draft: false`、`_build: {list: local}`；日期不可在未来。文章进入 Daily IELTS Reading 栏目，不进入首页文章流。
- 提交前运行 `python3 scripts/check_ielts_reading.py`、`hugo --minify --baseURL https://douyixuan.github.io/`；查看渲染页面的原文链接、五个独立 details 和栏目入口，并确认首页没有该文章。
- 在已授权的发布路径提交；无直接发布授权时创建 draft PR，不能自行 merge。同步最新 master，保留并发修改，不强推。
- 查询**本次提交 SHA**对应的 GitHub Actions。只有 Pages 部署成功且实际文章 URL 可访问、内容核对无误才通知“已发布”；否则报告具体失败及 CI 链接。不要以其他栏目 CI 或仅已提交代替发布证据。
- 每次计划执行必须包含上述博客步骤，并在通知中附文章 URL 与本次 CI 结果；没有仓库访问能力时明确报告阻塞，不悄悄退化为仅聊天输出。维护现有计划，不另建重复计划。
