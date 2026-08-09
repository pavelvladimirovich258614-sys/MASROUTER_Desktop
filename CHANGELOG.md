# Changelog

All notable changes to MASROUTER Desktop are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-08-09

### Added
- Fθ cascade implementation in `src/main/routerEngine.ts` — the
  deterministic rule-based core that mirrors the policy-gradient
  controllers from arXiv:2502.11133.
- Gamma function with Lanczos approximation in `src/main/gamma.ts`,
  driving the "Topological Multiplier Γ(k+1)" display in the UI.
- 18 pre-filled roles (9 from the paper's Appendix E.2 plus 9 server-side
  roles) in `shared/masrouterData.ts`.
- 6 pre-filled models from the paper's Appendix E.1, with per-token
  prices and benchmark scores (MMLU, GPQA, HumanEval, MATH).
- 7 collaboration topologies from Appendix E.3.
- 5 case study templates from Appendix C, one click loads the chain
  into the Router page.
- Ablation table (Table 3) and sensitivity tables (γ, λ) and
  plug-in results (Table 2) on the Ablation page.
- 6 LLM provider adapters: Ollama, OpenAI, OpenAI-compatible, MiniMax,
  StepFun, Custom REST.
- Final Prompt generator with the
  ROLE / POLICY / MODEL / CONTEXT / TASK / ALLOWED / FORBIDDEN /
  OUTPUT FORMAT / DONE CRITERIA / STOP CONDITIONS structure.
- Codex CLI bridge: writes `task.md`, copies the `codex --prompt-file
  ...` command, copies SSH commands through a whitelist.
- Shell command runner with whitelist + stoplist; shell disabled by
  default.
- 14 React pages: Dashboard, Router, Chain Builder, Models, Roles,
  Topologies, Prompt Lab, Cost, Codex, Settings, Logs, Help, Case
  Study, Ablation.
- 15 in-app help articles, with cross-links from `?` icons in the UI.
- Dark theme (default — black + cyan + mint) and light theme.
- 46 Vitest tests covering gamma, routerEngine, promptBuilder,
  costEstimator.
- GitHub Actions CI for Windows / macOS / Linux.
- NSIS installer (Windows), DMG + ZIP (macOS), AppImage + .deb
  (Linux), portable .exe.
- Auto-generated icons (SVG → PNG → multi-resolution .ico) via
  `scripts/generate-icon.mjs` and `scripts/generate-ico.mjs`.

### Security
- Electron `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`.
- API keys stored in `safeStorage`, masked in the UI.
- CSP locked to `self` plus an explicit allowlist of LLM provider
  domains.
- External links open in the system browser.
- Shell commands gated by whitelist + stoplist + user confirmation.
- No telemetry. No analytics. No remote calls except the LLM provider
  calls the user makes.

[0.1.0]: https://github.com/pavelvladimirovich258614-sys/MASROUTER_Desktop/releases/tag/v0.1.0
