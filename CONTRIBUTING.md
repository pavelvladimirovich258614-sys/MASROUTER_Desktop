# Contributing to MASROUTER Desktop

Thanks for your interest in contributing! This document is short on
purpose. The full process is also reflected in
[.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).

## Ground rules

- **Be kind.** This is a side project. We optimise for the long-term
  contributor relationship, not the short-term merge.
- **One thing per PR.** A fix for a typo, a new provider, a refactor of the
  cost estimator — separate PRs are easier to review and revert.
- **All new code ships with tests.** A PR that touches `routerEngine.ts`
  without a corresponding test in `tests/` will be politely sent back.
- **No new runtime dependencies without discussion.** The Electron bundle is
  already 78 MB. Adding a heavy dep needs a justification in the PR
  description.

## Development setup

```bash
git clone https://github.com/pavelvladimirovich258614-sys/MASROUTER_Desktop.git
cd MASROUTER_Desktop
npm install
npm run dev
```

Required: Node 20+, npm 10+.

## Before sending a PR

Run the local checks and paste the output in the PR description:

```bash
npm run typecheck
npm test
```

If you touched the renderer, also do `npm run build` to make sure Vite is
happy.

## Coding conventions

- **TypeScript strict mode is on.** Don't `any` your way out of things.
- **JSDoc on every exported function.** Even a one-liner. Especially if
  the function implements a rule from the MasRouter paper — reference the
  paper section.
- **Follow the existing file structure.** `shared/` is for code that both
  main and renderer can import. `src/main/` is main-only. `src/renderer/`
  is renderer-only. The preload bridge is in `src/preload/`.
- **Zod for IPC payloads.** Anything that crosses the main ↔ renderer
  boundary should be validated in `shared/schemas.ts`.
- **English for code comments, file names, identifiers.** The user-facing
  strings can be Russian or English; both are fine. If you change a
  Russian string, the in-app help article should be updated too.

## Adding a new provider

1. Create `src/main/providers/yourProvider.ts` implementing the
   `LLMProvider` interface from `shared/types.ts`.
2. Register the new kind in the `ProviderKind` union in
   `shared/types.ts` and the `providerKindSchema` in `shared/schemas.ts`.
3. Wire it up in `src/main/providers/providerManager.ts`.
4. Add the new provider to the seed list in `src/main/storage.ts`.
5. Add a help article in `src/renderer/help/helpArticles.ts`.
6. Add a test for the request / response mapping.

## Adding a new role

1. Open `shared/masrouterData.ts`.
2. Add the role to `BUILTIN_ROLES` with `id`, `name`, `description`,
   `outputFormat`, `allowedActions`, `forbiddenActions`, `riskLevel`,
   `category`, and `builtin: true`.
3. If the role is used in the default cascade (`src/main/routerEngine.ts`),
   wire it into the appropriate branch in `allocateRoles()`.
4. Add a test in `tests/routerEngine.test.ts`.

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Please
include:

- App version (visible in Settings → About, or in the top-left of the
  sidebar).
- Operating system and version.
- The exact steps to reproduce.
- The expected vs actual behaviour.
- Screenshots if relevant.

## Requesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).
For substantial changes, please open an issue first to discuss before
sending a PR — saves everyone time.

## Code of conduct

Be respectful. We follow the spirit of the
[Contributor Covenant](https://www.contributor-covenant.org/). Report
unacceptable behaviour to the maintainers.
