---
trigger: always_on
---

# Antigravity Agent Rules — enveil (Chrome Extension)

> Project: **enveil**  
> Type: **Chrome Extension / Browser-side Agent**  
> Core Principle: **Doc-first, Minimal, Deterministic**

---

## 1. 全局回复准则（强制）

- **极简主义输出**  
  - 禁止寒暄、确认性废话（如 “好的”“明白了”）。
  - 直接输出可执行的设计、结论或代码。

- **文档优先（Doc-First）**  
  - **任何实现或修改前，必须先阅读并引用 `docs/`、`README.md`、`design.md` 等文档**。
  - 若文档缺失或存在歧义，必须先指出，而不是自行假设。

- **显式实现思路**  
  - 复杂问题先给出 **[实现思路]**，再给出代码或配置。
  - 禁止输出隐含推理过程或模糊描述。

- **确定性与可复现性**  
  - 所有方案必须可在本地 Chrome（stable）复现。
  - 禁止依赖“隐式浏览器行为”或未声明的实验特性。

- **安全与隐私优先**  
  - 涉及权限、用户数据、跨域、注入、远程代码执行时，必须明确风险。
  - 使用 **⚠️ WARNING** 标注潜在安全影响。

---

## 2. enveil 项目专项 SOP（严格执行）

当请求涉及 **enveil Chrome 插件** 的新增、修改或排错时，必须遵循以下流程：

### 2.1 深度上下文优先（禁止跳过）

1. **先读文档**
   - `README.md`：整体目标、能力边界。
   - `docs/architecture.md`：插件与后端/页面的交互模型。
   - `docs/security.md`：权限、数据流、威胁模型。
2. **再看代码**
   - `manifest.json`（v3）：权限、host_permissions、background/service worker。
   - `src/background/`：消息中枢、生命周期逻辑。
   - `src/content/`：DOM 注入、页面交互。
   - `src/popup/` / `src/options/`：用户界面。

> ⚠️ 禁止在未确认 manifest 约束前设计任何能力。

---

### 2.2 影响分析（Impact Analysis）

在给出任何代码前，**必须先输出以下内容**：

- **[文件改动清单]**
  - 列出将修改/新增的文件路径。
  - 说明每个文件的职责与修改原因。
- **[权限影响]**
  - 是否新增或扩大 Chrome permissions / host_permissions。
- **[数据流变化]**
  - 数据从哪里来 → 经谁处理 → 存到哪里 → 是否离开本地。

---

### 2.3 设计与实现原则

- **最小权限原则**
  - 只申请当前功能必需的权限。
  - 禁止使用 `"<all_urls>"` 作为偷懒方案。

- **最小侵入性**
  - content script 不得破坏宿主页面原有逻辑。
  - 禁止覆盖全局对象（如 `window.fetch`）除非有明确隔离方案。

- **一致性**
  - 目录结构、命名风格、消息协议必须与现有 enveil 代码保持一致。
  - 消息通信统一使用定义好的 `type` / `payload` 结构。

---

### 2.4 Chrome Extension 强制规范

- **Manifest V3 Only**
  - 不允许使用 background page（必须是 service worker）。
- **异步限制认知**
  - 明确 service worker 的生命周期与唤醒条件。
- **消息通信规范**
  - content ↔ background ↔ popup 必须通过 `chrome.runtime.sendMessage` / `onMessage`。
- **存储策略**
  - 明确使用 `chrome.storage.local` / `sync` 的原因与容量限制。

---

### 2.5 标准输出顺序（不可打乱）

当用户请求实现或修改功能时，按以下顺序输出：

1. **[实现思路]**
   - 高层设计 + 为什么这样做。
2. **[文件改动清单]**
   - 明确路径与职责。
3. **核心实现**
   - background / content / UI 分模块给出。
4. **安全与权限说明**
   - 是否新增权限、风险点。
5. **验证方式**
   - Chrome 加载插件步骤。
   - 最小可验证操作路径。

---

## 3. 安全红线（不可违反）

- ❌ 禁止在 content script 中执行不受控的 `eval` / `new Function`。
- ❌ 禁止静默收集用户隐私数据。
- ❌ 禁止绕过 Chrome 权限系统模拟高权限行为。
- ❌ 禁止在未声明的情况下与第三方域名通信。

---

## 4. 当信息不足时的处理方式

- 明确指出缺失内容（文档 / 接口 / 约束）。
- 给出 **最小补充信息清单**。
- 在信息补齐前，禁止输出“假定方案”。

---

## 5. Agent 行为底线

- enveil 是 **安全敏感型 Chrome 插件项目**。
- 正确性 > 功能完整性 > 实现速度。
- 任何“看起来能跑”的 hack 方案，默认不可接受。

---
