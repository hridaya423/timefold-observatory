This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## TimeFold native checkpoint

Use Node 24 for the built-in TypeScript tests. `npm run verify` performs typecheck, lint, domain/client/service tests, Deno backend checking, scratch Postgres tests, pinned Expo Doctor, and dependency compatibility. Docker must be running; Windows uses the project-local Deno 2.5.6 installed by `.devin/scripts/install-deno.ps1`, while Mac needs Deno available. The diagnostic scene is not the completed game; compiler/static checks do not prove physical-device input.

On this Windows workspace, dot-source `.devin/scripts/android-env.ps1` before Expo native commands. SDK location is D:\Android\Sdk and Gradle uses Android Studio's JBR 17 for project processes only. `npm run build:android` compiles the ARM64 debug diagnostic from the generated android directory without installing it. Never run prebuild with --clean over native work without specific approval.

The real numeric META_APP_ID is configured through ignored `.env`; `app.config.ts` validates it and passes it to the Viro plugin as `questAppId`. Use `aapt dump xmltree <apk> AndroidManifest.xml` to verify `com.oculus.app_id` in a built APK. The configured MCP is project-local viroreact; authenticate through Devin, never store OAuth tokens here. Credit-consuming cloud rendering or asset generation requires approval.

Residual npm advisories are approved only for controlled local development, not release. Keep Metro loopback-only except an explicitly authorized private-LAN device session; do not force dependency resolution or weaken install-script/security policies. The A+B visual reference is preserved on prototype/timefold-visual (7dec1f8), outside this native branch.

## Keeper boundaries

Canonical hint text and highlights come from shared/keeper.ts; generated narration is non-authoritative. Keep strict request/reply parsing, state revision checks, and provider quota reservation before generation. Authored mode must make no network/auth request. Native configuration accepts only HTTPS plus a new sb_publishable_ key; model/service-role keys belong exclusively to backend secrets.

The Deno entry is checked separately, not omitted from verification. Keep functions.keeper.verify_jwt enabled and additionally verify a user bearer token with Supabase Auth; a publishable key alone is not a user. KEEPER_ENABLED defaults to false. Creating/deploying a dedicated project, enabling live model use, and any paid usage require approval.

The database test script creates its own temporary, unexposed Postgres container with an in-memory generated password and removes only that container. Do not point it at an existing database or reuse production credentials. Remote JWT/model behavior remains unverified until separately authorized live tests.

## Local logic lab

`npm run web` serves the local inspection route /lab. With --localhost on this Windows host, Metro binds IPv6 loopback (::1), so use http://localhost:8081 rather than 127.0.0.1. The lab is authored-only and uses timefold.lab.progress.v1, separate from actual game saves; checkpoint writes and resets are explicit.

Keep native Viro imports behind xr/bootstrap.native.ts and XRLauncher.native.tsx. The web launcher only explains the hardware requirement; the 2D lab must not pull in an unused WebXR renderer or claim device input proof. Browser checks at 1440x1000 and 390x844 covered playthrough, undo, reset/cancel, persistence, corrupt saves, write failure and keyboard activation without model/backend calls.

## Observatory inspection and rendering

The native Home button opens /play?view=observatory; default /play still runs the hardware diagnostic. The observatory route uses explicit object selection and fixed named destination slots, not proven grab/drop or plane anchoring. It reads game progress and writes only on explicit Save; the logic lab keeps its separate key.

Use `node .devin/scripts/scene-render-source.mjs` (or --restored) for production-derived visual TSX and `node .devin/scripts/puzzle-render-source.mjs` for the real controls payload. Hosted rendering requires explicit React/Viro imports and an explicit Viro3DSceneNavigator; omitting them caused helper/context errors. SceneLabel generates fontSize 16 glyphs and scales the node, avoiding broken small-font glyphs seen in the WASM text pipeline. Native text readability remains a device gate.

Hosted scripted clicks are not reliable across rows: a requested y=0.64 visibly landed near canvas center and hit the upper control, while a same-row probe dispatched select then place successfully. Use hosted clicks only as limited visual/callback evidence; never call them physical-input proof.

The scratch Postgres readiness probe uses TCP 127.0.0.1, not only its Unix socket: initdb's temporary socket server reported ready and then shut down before SQL tests. No production quota/schema behavior was changed to fix this race.

The user specifically approved SDK patches published during this batch: Expo 57.0.27, constants 57.0.21, linking 57.0.12 and router 57.0.25. Keep exact pins and normal security/verification controls. AI asset generation and recorded-environment rendering still need specific credit approval; Studio Pro is not blanket spend authorization.
