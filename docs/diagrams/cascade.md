# MASROUTER — Architecture Diagrams

This file documents the internal architecture of MASROUTER Desktop. It is
referenced from the README and can be rendered directly on GitHub or in any
Mermaid-compatible Markdown viewer.

---

## 1. The Fθ cascade (the core idea)

The whole routing decision is a single deterministic cascade:

```
Q (a user task) ──Fθt──▶ T (topology) ──Fθr──▶ {R_i} (chain of roles) ──Fθm──▶ {M_i} (chain of models)
       │                      │                       │                              │
       │                      │                       │                              │
   ┌───┴────┐             ┌────┴────┐              ┌───┴────┐                    ┌────┴────┐
   │ Risk   │             │ Single  │              │ Analyst│                    │ gpt-4o- │
   │ Score  │             │ Chain   │              │ Implem.│                    │  mini   │
   │ 1/2/3  │             │ Tree    │              │ Tester │                    │ Claude  │
   └────────┘             │ FullC.  │              │ Review.│                    │ Gemini  │
                         │ Debate  │              │ SecRev.│                    │ DeepSeek│
                         │ Reflect.│              │ ...    │                    │ Ollama  │
                         └─────────┘              └────────┘                    └─────────┘
```

In code, this lives in `src/main/routerEngine.ts`. The cascade is
**deterministic and rule-based** — no LLM is used inside the router itself,
which keeps it fast, predictable, and auditable.

---

## 2. Request flow inside the Electron app

```mermaid
flowchart TB
    User([User]) -->|writes task| Form[RouterPage form]
    Form -->|click Calculate| IPC{{ipcMain: ROUTER_CALCULATE}}
    IPC --> Engine[routerEngine.ts]

    Engine --> F1[Fθt — risk & topology]
    F1 --> F2[Fθr — role chain]
    F2 --> F3[Fθm — model per role]

    F3 --> Decision{RouteDecision}
    Decision --> Card[Result card]
    Decision --> Cost[costEstimator]
    Decision --> Prompt[promptBuilder]

    Card -->|copy/send| UI[React UI]
    Prompt -->|Final Prompt| CodeX[Codex CLI / Provider]
    Cost -->|estimated cost| Log[(electron-store)]

    UI -->|click| CodexBridge[codexBridge.ts]
    CodexBridge -->|task.md + command| Disk[(user disk)]
    CodexBridge -->|copy| Clipboard[(clipboard)]
```

---

## 3. Provider architecture (LLM I/O)

```mermaid
flowchart LR
    UI[React renderer] -->|api.providerChat| Preload[preload: contextBridge]
    Preload -->|IPC| Main[main: providerManager]
    Main -->|case kind| Ollama[Ollama local]
    Main -->|case kind| OpenAI[OpenAI / OpenAI-compatible]
    Main -->|case kind| MiniMax[MiniMax]
    Main -->|case kind| StepFun[StepFun]
    Main -->|case kind| Custom[Custom REST]
    Ollama -->|HTTP| OllamaAPI[http://127.0.0.1:11434]
    OpenAI -->|HTTPS| OpenAIAPI[https://api.openai.com]
    StepFun -->|HTTPS| StepAPI[https://api.stepfun.com]
    Custom -->|HTTPS| UserAPI[(user-defined endpoint)]
```

API keys are stored in `safeStorage` (OS-level encryption) and exposed to the
renderer only as a masked string.

---

## 4. Risk → Cost Mode decision

```mermaid
flowchart TD
    Start([Task input]) --> Risk{riskFlags?}
    Risk -->|money/payment/discount/<br/>security/database/deploy| R3[Risk = 3]
    Risk -->|complexity=High| R3
    Risk -->|complexity=Medium| R2[Risk = 2]
    Risk -->|else| R1[Risk = 1]

    R3 --> Q[Cost = QUALITY, λ=5, strong tier]
    R2 --> B[Cost = BALANCED, λ=15, balanced tier]
    R1 --> E1{complexity=Low?}
    E1 -->|yes| E[Cost = ECO, λ=25, cheap tier]
    E1 -->|no| B

    Q --> Chain[Chain + Reviewer + SecurityReviewer]
    B --> Chain2[Chain + Analyst → Implementer → Tester]
    E --> Single[Single + Implementer]
```

This mirrors the cascade in the original paper: tasks touching money, security
or databases must always run on strong models with a security review pass.
