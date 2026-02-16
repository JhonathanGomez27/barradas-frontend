# MODULES KNOWLEDGE BASE

## OVERVIEW
`src/app/modules` hosts feature domains. Current modules: `admin`, `agent`, `auth`, `docuseal`, and `landing`.

## STRUCTURE
```text
src/app/modules/
|- admin/     # primary business workflows (clients, stores, rbac, stats)
|- agent/     # agent-side client and credit operations
|- auth/      # sign-in/sign-out flows
|- docuseal/  # signature/session integration screens
`- landing/   # public/guest completion and web-rtc pages
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Admin clients and credit lifecycle | `src/app/modules/admin/clients/` | deepest logic; resolver-heavy |
| Store + agent assignment | `src/app/modules/admin/stores/` | nested dialogs/forms |
| RBAC roles/permissions | `src/app/modules/admin/rbac/` | permission matrix management |
| Agent client operations | `src/app/modules/agent/clients/` | mirrors admin flow with agent constraints |
| Auth pages | `src/app/modules/auth/` | empty layout child routes |
| Public profile completion | `src/app/modules/landing/complete-profile/` | token-based onboarding |

## CONVENTIONS
- Feature routes are split into `*.routes.ts` and default-export `Routes`.
- Resolvers are colocated inside route files and often preload clients/stores/credits.
- Dialog components use `-dialog.component.ts` naming and stay near feature folders.
- Permission enforcement is dual-layer: route metadata + component checks via `PermissionService`.
- Pagination defaults come from `environment.pagination` and are reused in resolvers/services.

## ANTI-PATTERNS
- Do not bypass `hasPermissionGuard` for protected routes.
- Do not copy/paste status mappers across features; centralize when expanding shared status logic.
- Do not move feature files into `core` unless reused across independent domains.
- Do not call backend endpoints without composing from `environment.url`.

## NOTES
- `admin` is the heaviest module and contains large components; prefer additive, focused edits.
- `agent/clients` reuses some admin-domain services (for example stores), so check cross-module impacts before edits.
