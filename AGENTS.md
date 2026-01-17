# AGENTS.md - Codebase Guidelines for Agentic Coding

This document provides guidelines for AI agents working on this Angular 19 project.

## Build, Lint, and Test Commands

### Development
- `npm start` - Start development server (ng serve)
- `npm run watch` - Build in watch mode with source maps for development

### Build
- `npm run build` - Production build (output to `dist/fuse`)
- `npm run build -- --configuration development` - Development build with source maps

### Testing
- `npm run test` - Run all tests with Karma/Jasmine
- Run single test file: `npx ng test --include="**/stores.service.spec.ts"`
- Run tests with coverage: `npx ng test --code-coverage`

### Code Formatting
- `npx prettier --check src/` - Check formatting issues
- `npx prettier --write src/` - Auto-fix formatting issues
- Format specific file: `npx prettier --write src/app/modules/admin/stores/stores.service.ts`

### Type Checking
- `npx tsc --noEmit` - Type-check without emitting files

## Code Style Guidelines

### General Principles
- Use TypeScript strict mode features
- Prefer explicit types over type inference for public APIs
- Keep functions small and single-purpose
- Use meaningful variable and function names

### Imports and Organization
- Organize imports with Prettier (automatic via plugins)
- Import order: Angular core, third-party, app imports, relative imports
- Use absolute imports from `src` (configured via `baseUrl`)
- Example: `import { StoresService } from 'app/modules/admin/stores/stores.service';`
- Use barrel exports (`index.ts`) for public APIs

### Formatting
- 4 spaces for indentation
- Single quotes for strings
- Trailing commas (ES5 compatible)
- Arrow functions: always wrap parameters in parentheses
- Bracket spacing: true
- Bracket same line: false

### Naming Conventions
- **Classes**: PascalCase (`StoresService`, `StoreDetailsComponent`)
- **Interfaces**: PascalCase with optional "I" prefix (`Store`, `IStore`)
- **Variables/Properties**: camelCase (`storesList`, `isLoading`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants, camelCase for service constants
- **Private members**: Prefix with underscore (`_stores`, `_unsubscribeAll`)
- **Files**: kebab-case for components/services (`store-form-dialog.component.ts`)
- **CSS classes**: kebab-case, use Tailwind utility classes

### TypeScript Patterns
- Use interfaces for data shapes and DTOs
- Use explicit return types for public methods
- Avoid `any` - use `unknown` or proper types
- Use discriminated unions for API responses
- Strict null checks enabled

### Angular Patterns
- Use standalone components (Angular 19 default)
- Use `OnPush` change detection when possible
- Implement `OnDestroy` and use `takeUntil` pattern for subscription cleanup:
```typescript
private destroy$ = new Subject<void>();

ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
}
```
- Use `BehaviorSubject` for state with `asObservable()` exposure
- Use Reactive Forms with typed form groups
- Use async pipe in templates over manual subscriptions

### RxJS Usage
- Use descriptive variable names for observables (`stores$`, `isLoading$`)
- Use proper operators: `tap` for side effects, `map` for transformations
- Use `takeUntil` for subscription management
- Handle errors with `catchError` or subscribe error callbacks
- Use `shareReplay(1)` for caching observable data

### Error Handling
- Use `console.error` for logging errors
- Show user feedback via `MatSnackBar` or `AlertsService`
- Handle API errors in subscribe callbacks with `error` handler
- Never expose sensitive information in error messages

### Template Guidelines
- Use strict template binding types
- Use `*ngIf` with `as` for async pipe results
- Avoid complex logic in templates - move to component
- Use Angular Material components for UI
- Use Tailwind CSS utilities for layout and styling

### Styling (Tailwind + SCSS)
- Use Tailwind utility classes for styling
- Custom colors available: `barradas-50`, `barradas-300`, `barradas-500`, `barradas-700`, `barradas-900`
- Use SCSS for component-specific styles (`.scss` files)
- Follow Tailwind theme configuration in `tailwind.config.js`

### Component Structure
- Standalone components with `imports` array
- Use `styleUrl` (singular) for component styles
- Define public APIs in interfaces
- Keep business logic in services, not components
- Use dependency injection with `@Injectable({ providedIn: 'root' })` for singletons

### API Integration
- Use `HttpClient` with typed responses
- Define DTO interfaces for request/response
- Use environment variables for API URL (`environment.ts`)
- Handle pagination with `PaginatedResponse<T>` interface

### File Structure
```
src/
  app/
    core/           # Singleton services, guards, interceptors
    shared/         # Shared components, directives, pipes, services
    modules/        # Feature modules (admin, agent, etc.)
    layout/         # App layout components
  @fuse/            # Fuse UI library customization
  environments/     # Environment configuration
```

### Third-Party Libraries
- **Angular Material**: UI components (buttons, tables, dialogs, etc.)
- **RxJS**: Reactive programming
- **SweetAlert2**: Alert dialogs (`AlertsService`)
- **Transloco**: Internationalization
- **Tailwind CSS**: Utility-first styling
- **Quill**: Rich text editor
- **ApexCharts**: Charts

### Testing Guidelines
- Write unit tests for services and components
- Use Jasmine syntax (`describe`, `it`, `expect`)
- Mock dependencies with `jasmine.createSpyObj` or `TestBed`
- Test async code with `fakeAsync` and `tick`
- Aim for meaningful test coverage on critical paths
