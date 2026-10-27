# Daily IELTS Reading 发布约定

- 仓库 douyixuan/douyixuan.github.io，发布分支 **master**（不是 main）。现有 Pages workflow 在 master push 后构建部署；它不负责生成文章。ChatGPT 输出不是博客发布。
- 每天中午 Asia/Shanghai 精选一篇可免费、免登录阅读全文的英文文章，核实标题、作者、日期与原文 URL；不选 Scientific American 等付费来源。优先选择明确允许全文转载且本站符合许可条件的来源；免费可读不等于可转载。核实具体文章的许可范围、例外和署名条件。
- 每篇独立保存为 `content/posts/ielts-reading/YYYY-MM-DD.md`。运行前检查当日文件及原文 URL，避免重复。只补本次必要内容，不批量补历史。
- 延续栏目格式：原文卡片、简短导读、词汇、五道阅读理解题、逐题参考答案、可积累表达。每道题后使用 `{{< answer >}}` 与 `{{< /answer >}}`，答案依据原文核对，禁止省略。
- front matter 使用 `categories: ["ielts-reading"]`、`series: ["Daily IELTS Reading"]`、`draft: false`、`_build: {list: local}`；日期不可在未来。文章进入 Daily IELTS Reading 栏目，不进入首页文章流。
- 提交前运行 `python3 scripts/check_ielts_reading.py`、`hugo --minify --baseURL https://douyixuan.github.io/`；查看渲染页面的原文链接、五个独立 details 和栏目入口，并确认首页没有该文章。
- 在已授权的发布路径提交；无直接发布授权时创建 draft PR，不能自行 merge。同步最新 master，保留并发修改，不强推。
- 查询**本次提交 SHA**对应的 GitHub Actions。只有 Pages 部署成功且实际文章 URL 可访问、内容核对无误才通知“已发布”；否则报告具体失败及 CI 链接。不要以其他栏目 CI 或仅已提交代替发布证据。
- 每次计划执行必须包含上述博客步骤，并在通知中附文章 URL 与本次 CI 结果；没有仓库访问能力时明确报告阻塞，不悄悄退化为仅聊天输出。维护现有计划，不另建重复计划。

- 用户已要求英文全文放在文章最后：仅在明确许可适用于该文章且本站符合条件时，将完整未经改写的正文放在所有教学内容之后（文章末尾），保留原文段落、链接并与本站教学内容分隔。不批量补历史。
- 全文顶部附原始标题、副标题、作者、来源、日期、原文 URL 及许可政策链接；底部按来源要求保留转载声明。MIT News 按 https://news.mit.edu/terms-of-use 保留顶部信息及链接原文的 MIT News 署名，并在正文末尾加入链接 https://news.mit.edu/ 的 “Reprinted with permission of MIT News”。该政策图片许可不能标成文章正文许可；无许可的第三方图片不复制。
- 提交前核对完整正文与对应来源版本逐段一致，确认渲染顺序为导读、词汇、练习、原文全文（其他教学内容也须置于原文前）。许可不明时先报告并完成调查，不转载或擅自替换已选文章。未来选文须先检查可合法全文转载条件，不只检查免费可读。
