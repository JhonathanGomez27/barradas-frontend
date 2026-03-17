# CORE KNOWLEDGE BASE

## OVERVIEW
`src/app/core` contains singleton infrastructure used by all feature modules: auth, user session, navigation, icon provider, transloco bootstrap, and role-based directives.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Auth token/session flow | `src/app/core/auth/auth.service.ts` | login/logout/check + token storage |
| HTTP auth injection | `src/app/core/auth/auth.interceptor.ts` | functional interceptor pattern |
| Global auth wiring | `src/app/core/auth/auth.provider.ts` | `provideAuth()` setup |
| Permission guard behavior | `src/app/core/auth/guards/has-permission.guard.ts` | route role/permission gate + redirects |
| Current user state | `src/app/core/user/user.service.ts` | replayed user stream |
| Navigation bootstrap | `src/app/core/navigation/navigation.service.ts` | feeds layout navigation |
| UI role-gating | `src/app/core/directives/show-for-roles.directive.ts` | structural permission directive |

## CONVENTIONS
- Prefer functional Angular primitives in core (`CanActivateFn`, interceptor fn, `inject()`).
- Keep core services singleton (`providedIn: 'root'`) with private subject + public `$` observable.
- Add global provider wiring through `*.provider.ts` and `app.config.ts`, not directly inside feature modules.
- Keep core APIs framework-agnostic for reuse by admin/agent/landing routes.

## ANTI-PATTERNS
- Do not place feature business rules in core.
- Do not navigate directly from feature services for auth/permission decisions; route through guards.
- Do not duplicate permission logic in many components if guard/directive already handles it.
- Do not add new auth endpoints with hardcoded host; use `environment.url`.

## QUICK COMMANDS
```bash
npx tsc --noEmit
npm run test
npx ng test --include="**/core/**/*.spec.ts"
```

## NOTES
- `hasPermissionGuard` supports both `expectedPermission` and `expectedRole`; route metadata drives enforcement.
- Redirect fallback convention is role-aware: admin -> `/clients`, agent -> `/clients-store`, else -> `/sign-in`.
