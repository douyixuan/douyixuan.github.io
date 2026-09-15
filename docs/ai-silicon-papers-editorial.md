# AI 原生芯片与工具链论文专栏维护约定

- 仓库：douyixuan/douyixuan.github.io；发布分支 master；Hugo/PaperMod。
- 专栏：content/posts/ai-silicon-papers/；地址 https://douyixuan.github.io/posts/ai-silicon-papers/ 。
- 一篇论文一个日期文件 YYYY-MM-DD.md；日期采用 Asia/Shanghai，不能设置为未来时间而导致 Hugo 跳过。paper_id 使用不含版本后缀的 arXiv ID，重复运行先检查日期与 paper_id。
- 每次选择一篇：AI for Silicon/EDA、AI 编译器与 GPU kernel 工具链、规格/形式化验证/评测、领域知识与 Agent 工作流。优先近期可免费阅读全文的论文，无合适新作可选未收录经典。
- 核对标题、作者、日期、版本和论文类型。必须阅读一手来源，不能仅凭标题或二手摘要写导读。区分论文实证、作者预测、编辑推论和未运行的实验设计。
- 固定结构：论文卡片（含 alphaXiv、arXiv、全文/PDF）、一个核心问题、简短中文导读、证据与限制、重点阅读章节、思想启发、三个开放性思考问题（思考线索用 details 折叠）。
- 内容边界（用户明确要求）：只讲论文本身、思考启发和提问，不添加结合用户工作、工程落地、项目迁移、行动清单、实操练习、十分钟任务或复现计划。问题围绕假设、证据、概念边界、反例与未解决的矛盾，不能变成布置任务。
- 有 arXiv ID 时提供 https://www.alphaxiv.org/abs/<ID> 入口；未核实具体 overview/blog 时不要编造。入口不代表存在 alphaXiv 自动导读。若无 arXiv 版本，优先另选有合法全文与 alphaXiv 对应入口的论文。
- 尊重原文版权，控制转述篇幅，不复制全文。思想启发明确区分于作者结论；开放问题不预设唯一正确答案。
- 延用 _index.md 的 cascade：文章只进专栏，不进入首页文章流；入口保留在导航。保持 RSS 和站内搜索可发现。
- 提交前检查仓库指令、front matter、链接、重复论文、未来日期、Hugo 构建和文章渲染。尽量每次一个原子提交，禁止覆盖并发修改或强推。
- 每次发布必须查询本次提交 SHA 对应的 GitHub Actions，确认构建与 Pages 部署成功。失败时读取日志、修复并重查；无法修复则明确阻塞原因，不能把已提交说成已发布。
- 成功后发送简短通知：论文、核心问题、文章与 alphaXiv 链接、CI 结果。不要恢复已暂停的其他论文复现任务。
