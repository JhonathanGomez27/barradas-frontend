# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-16 14:40 America/Bogota  
**Commit:** 06df8b2  
**Branch:** main

## OVERVIEW
Angular 19 frontend based on Fuse. Main business domains live in `src/app/modules`; framework-level UI primitives and theming internals live in `src/@fuse`.

## STRUCTURE
```text
./
|- src/app/           # app code: routes, core infra, layouts, feature modules
|- src/@fuse/         # Fuse UI framework internals and extension points
|- src/environment/   # single environment source (`environment.ts`)
|- public/            # runtime assets (this repo does not use src/assets)
`- AGENTS.md          # root rules; child AGENTS.md add local constraints
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App bootstrap/providers | `src/main.ts`, `src/app/app.config.ts` | Standalone bootstrap + global providers |
| Top-level navigation and guards | `src/app/app.routes.ts` | Lazy routes + `AuthGuard` + `hasPermissionGuard` |
| Auth/session | `src/app/core/auth/` | Functional guards/interceptor/provider |
| Admin feature work | `src/app/modules/admin/` | Most business-heavy area |
| Agent feature work | `src/app/modules/agent/` | Agent-specific client/credit flows |
| Fuse framework behavior | `src/@fuse/` | Treat as vendor-in-source; edit carefully |
| API base and pagination constants | `src/environment/environment.ts` | `environment.url`, `environment.pagination` |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `appRoutes` | const | `src/app/app.routes.ts` | high | root route tree, lazy boundaries, guard metadata |
| `appConfig` | const | `src/app/app.config.ts` | high | provider wiring (`provideRouter`, `provideAuth`, `provideFuse`) |
| `initialDataResolver` | resolver | `src/app/app.resolvers.ts` | medium | preloads layout/navigation data |
| `hasPermissionGuard` | guard fn | `src/app/core/auth/guards/has-permission.guard.ts` | high | permission/role gate with fallback redirects |
| `environment` | const | `src/environment/environment.ts` | high | host/API URL, pagination, completion host |

## CONVENTIONS
- Uses `src/environment/environment.ts` (singular directory), not `src/environments/*` replacements.
- `*.routes.ts` exports `default` `Routes`; resolvers are colocated with feature routes.
- Permission checks are route-driven (`data.expectedPermission` / `data.expectedRole`) and component-driven (`PermissionService`).
- Shared domain typing is mixed by intent: `*.types.ts`, `*.interface.ts`, and some `*.models.ts`.
- Tests are configured (Karma/Jasmine) but schematics default to `skipTests: true`; many features have no local specs.

## ANTI-PATTERNS (THIS PROJECT)
- Do not edit `src/@fuse/**` for feature business logic; prefer config/overrides in app space.
- Do not hardcode API hosts in services; always compose from `environment.url`.
- Do not bypass route permission metadata when adding secure pages.
- Do not introduce `src/assets` assumptions; static assets are served from `public/`.
- Do not rely on generated test stubs; they are disabled by default, create specs explicitly when needed.

## UNIQUE STYLES
- Fuse-driven layout shells (`LayoutComponent`) split guest/auth/admin/agent trees in one root route file.
- Admin and Agent domains use parallel client flows with resolver-first data loading.
- Global paginator i18n is customized via `CustomMatPaginatorIntl` in app providers.

## COMMANDS
```bash
npm start
npm run build
npm run build -- --configuration development
npm run test
npx ng test --include="**/path/to/file.spec.ts"
npx ng test --code-coverage
npx tsc --noEmit
npx prettier --check src/
npx prettier --write src/
```

## NOTES
- Node version pinned via `.nvmrc` (`20`); npm uses `legacy-peer-deps=true`.
- Build output path is `dist/fuse`.
- `angular.json` allows specific CommonJS deps; avoid expanding list unless unavoidable.
- Root docs with implementation context: `USAGE_GUIDE.md`, `BACKEND_SERVICES_ANALYSIS.md`, `RBAC_FRONTEND_SPEC.md`.
