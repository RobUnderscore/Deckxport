# Claude Code Instructions for Deckxport

## Project Overview
Deckxport is a React-based web application for importing and analyzing Magic: The Gathering decks from Moxfield. It enriches deck data with information from Scryfall and oracle tags from Scryfall Tagger, providing comprehensive deck analysis and evaluation tools. Built with TypeScript for type safety and modern React patterns.

## Code Standards

### Language & Framework
- Primary language: TypeScript (strict mode enabled)
- Framework: React 18.3.1
- Build tool: Vite
- Package manager: npm
- Module type: ES modules

### Code Style
- Indentation: 2 Spaces
- Line length: 100 characters
- Naming conventions:
  - Variables: camelCase
  - Functions: camelCase
  - Classes: PascalCase
  - Files: camelCase
  - React components: PascalCase

### UI Component Standards
- **ALWAYS use shadcn/ui components** from `src/components/ui/`
- Available components: button, input, alert (add more as needed)
- For one-off customizations:
  - Use the `cn()` utility to merge classes
  - Pass custom className props
  - Create variants using CVA (class-variance-authority)
- Pattern for new UI components:
  ```tsx
  import { cn } from "@/lib/utils"
  import { VariantProps, cva } from "class-variance-authority"
  
  const componentVariants = cva("base-classes", {
    variants: {
      variant: { default: "...", secondary: "..." },
      size: { default: "...", sm: "...", lg: "..." }
    }
  })
  ```
- Use Radix UI primitives for complex interactions
- Style with Tailwind CSS using CSS variables for theming

### Testing
- Test framework: Vitest
- Test commands:
  - `npm test` - Run all tests
  - `npm run test:ui` - Run tests with UI
  - `npm run test:coverage` - Run tests with coverage report (REQUIRED before commits)
  - `npm run test:integration` - Run integration tests only
- Coverage requirements: REQUIRED - aim for >80% coverage
- Testing utilities: React Testing Library, @testing-library/jest-dom
- Tests location: Colocated in `__tests__` directories

### Type Checking
- **REQUIRED**: Run `npm run type-check` before committing
- TypeScript configured with strict mode
- No implicit any allowed
- Must fix all type errors before committing

### Linting & Formatting
- Linter: ESLint
- Lint command: `npm run lint`
- Formatter: Prettier
- Format command: `npm run format`

## Project Structure
```
src/
├── components/       # React components and pages
│   ├── ui/          # shadcn/ui reusable components
│   └── __tests__/   # Component tests
├── hooks/           # Custom React hooks
├── services/        # API services (Moxfield, Scryfall, Tagger)
│   └── evaluation/  # Deck evaluation logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and helpers
├── lib/             # Core utilities (cn, utils)
├── styles/          # Global styles and CSS
└── tests/           # Test setup and utilities
```
```

## Key Dependencies
### Core
- **React 18.3.1** - UI framework
- **React Router DOM** - Client-side routing
- **@tanstack/react-query** - Server state management and caching
- **TypeScript** - Type safety and better DX

### UI/Styling
- **shadcn/ui** - Reusable component library
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **class-variance-authority** - Variant styling system
- **clsx & tailwind-merge** - Utility for merging classNames
- **Lucide React** - Icon library

### Development
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit testing framework
- **@testing-library/react** - React testing utilities
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Development Workflow

### Running the Project
```bash
# Install dependencies
npm install

# Run development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Before Committing
1. Run type check: `npm run type-check` (REQUIRED)
2. Run tests with coverage: `npm run test:coverage` (REQUIRED)
3. Run linter: `npm run lint`
4. Run formatter: `npm run format`

## Important Notes
- **Module type**: Project uses ES modules (`"type": "module"`)
- **Path aliases**: Use @/ for src/, configured in tsconfig and vite.config
- **Strict TypeScript**: All code must pass strict type checking
- **Component patterns**: Always prefer shadcn/ui components over custom implementations
- **Testing**: Aim for >80% test coverage, tests are colocated with components
- **State management**: Use React Query for server state, React hooks for local state

## Common Tasks
### Adding a new shadcn/ui component
```bash
# Use the shadcn CLI to add components
npx shadcn-ui@latest add [component-name]
```

### Creating a new component
1. Create component in appropriate directory
2. Use shadcn/ui components for UI elements
3. Add tests in `__tests__` directory
4. Export from index file if needed

### Running specific tests
```bash
# Run tests for a specific file
npm test -- path/to/test

# Run tests in watch mode
npm test -- --watch

# Run only integration tests
npm run test:integration
```

## API Keys & Environment Variables
Environment variables use Vite's system with `VITE_` prefix:
- `VITE_API_BASE_URL` - Base URL for API endpoints
- `VITE_PUBLIC_API_KEY` - Public API key for external services
- `VITE_ENABLE_ANALYTICS` - Enable/disable analytics (true/false)
- `VITE_ENABLE_DEBUG` - Enable debug mode (true/false)

For Vercel deployment (serverless functions):
- `TAGGER_CSRF_TOKEN` - CSRF token for Scryfall Tagger API
- `TAGGER_SESSION_COOKIE` - Session cookie for Scryfall Tagger API

Create a `.env.local` file for local development (git-ignored)

## Key Features

### Data Flow
1. **Moxfield Import**: Fetch deck data from Moxfield API via CORS proxy
2. **Scryfall Enrichment**: Add card images, prices, and detailed data
3. **Oracle Tags**: Fetch functional tags from Scryfall Tagger (rate-limited to 250ms/request)
4. **Unified Aggregate**: All data combined into `CardAggregate` type

### Table Preferences
- Column visibility and sorting preferences are automatically saved to localStorage
- Preferences persist across browser sessions
- Quick presets: "Show All", "Show Minimal", "Reset to Defaults"

### Deck Evaluation
- Commander deck analysis with oracle tag support
- Categories: Ramp, Card Draw, Interaction, Win Conditions, etc.
- Automatic suggestions based on deck composition

### API Proxies
- **Development**: Vite proxy configuration handles CORS
- **Production**: Vercel serverless functions for Tagger API
- **Moxfield**: Uses corsproxy.io for CORS bypass

## Accessing Screenshots from Windows

When working with screenshots or files from Windows in this WSL2 environment:

- Windows files are accessible through `/mnt/c/`
- Example: `C:\Users\Rob\Pictures\Screenshots\file.png` becomes `/mnt/c/Users/Rob/Pictures/Screenshots/file.png`
- Always use the `/mnt/c/` prefix when accessing Windows files
- When the user asks you to check the latest screenshot, pull up the last screenshot by date from the Pictures\Screenshots folder and evaluate it