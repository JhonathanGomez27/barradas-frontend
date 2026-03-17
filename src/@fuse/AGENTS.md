# FUSE KNOWLEDGE BASE

## OVERVIEW
`src/@fuse` is vendor-in-source framework code (UI components, directives, theming, services, mock-api internals). Treat as infrastructure, not feature space.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Global theme variables | `src/@fuse/styles/themes.scss` | base color token wiring |
| Tailwind bridge/theming plugin | `src/@fuse/tailwind/plugins/theming.js` | maps theme config to css vars |
| Navigation primitives | `src/@fuse/components/navigation/` | recursive menu rendering |
| Framework mock-api internals | `src/@fuse/lib/mock-api/` | request-handler infrastructure |
| App-facing configuration entry | `src/@fuse/fuse.provider.ts` | consumed from `app.config.ts` |

## SAFE CUSTOMIZATION ZONES
- `tailwind.config.js` for palettes and theme ids.
- `src/app/app.config.ts` for selected Fuse layout/scheme/theme.
- `src/styles/styles.scss` for app overrides above Fuse defaults.

## CONVENTIONS
- Keep Fuse service/component APIs stable for app modules.
- Respect existing split between `components/`, `services/`, `directives/`, and `tailwind/` plugin utilities.
- Use app-level overrides before editing Fuse internals.

## ANTI-PATTERNS
- Do not add business logic to `src/@fuse/**`.
- Do not patch Fuse internals for one feature screen unless the change is framework-wide.
- Do not change theme token generation without validating all configured themes.
- Do not duplicate functionality already available in Fuse services/components.

## NOTES
- Project sets default theme in `app.config.ts` (`theme-brand`); Fuse theme ids must stay aligned with Tailwind theme config.
- Fuse navigation and layout are central to all routed shells; test both admin and agent trees after framework-level edits.
