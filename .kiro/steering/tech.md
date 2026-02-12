# Technology Stack

## Frontend

### Core Technologies
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios with TanStack React Query
- **Module System**: ESNext with bundler resolution

### Development Tools
- **TypeScript**: v5.2+ with strict mode enabled
- **ESLint**: Configured with accessibility plugin (jsx-a11y)
- **Path Aliases**: `@/*` maps to `src/*`

### Accessibility
- **Linting**: eslint-plugin-jsx-a11y (recommended rules)
- **Target Compliance**: WCAG 2.1 AA level
- **Key Requirements**: 
  - Semantic HTML
  - ARIA labels
  - Keyboard navigation
  - Screen reader optimization

## Backend

### Core Technologies
- **Runtime**: Node.js with TypeScript
- **Framework**: Express
- **Module System**: CommonJS
- **API Style**: RESTful

### Key Dependencies
- **CORS**: Cross-origin resource sharing
- **OpenAI**: AI service integration
- **ytdl-core**: Video processing
- **UUID**: Unique identifier generation
- **dotenv**: Environment configuration

### Development
- **Dev Server**: tsx watch mode
- **Build**: TypeScript compiler (tsc)

## Common Commands

### Frontend Development
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production (tsc + vite build)
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:a11y    # Run accessibility linting
```

### Backend Development
```bash
cd server
npm run dev          # Start dev server with watch mode
npm run build        # Compile TypeScript
npm run start        # Run production build
```

### Full Stack Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server && npm run dev
```

## Build Configuration

### Frontend (Vite)
- Dev server: localhost:3000 with auto-open
- Path alias: `@` → `./src`
- React plugin with Fast Refresh

### TypeScript Configuration
- **Target**: ES2020
- **Strict Mode**: Enabled
- **Unused Variables**: Error on unused locals/parameters
- **JSX**: react-jsx transform
- **Module Resolution**: Bundler mode (frontend), Node (backend)

## Code Style Guidelines

### TypeScript
- Use strict type checking
- Avoid `any` types
- Enable all strict compiler options
- Use explicit return types for functions

### React
- Functional components with hooks
- Use React.memo for performance optimization
- Follow React Hooks rules (enforced by ESLint)

### Accessibility
- All interactive elements must be keyboard accessible
- Images require alt text (enforced by ESLint)
- ARIA props must be valid (enforced by ESLint)
- Click handlers need corresponding keyboard events (warning)

## Environment Setup

### Prerequisites
- Node.js (compatible with ES2020)
- npm or yarn package manager

### Environment Variables
Backend requires `.env` file in `server/` directory (see `server/.env.txt` for template)

## Testing Strategy
- Accessibility testing with screen readers (NVDA/JAWS)
- Keyboard navigation testing
- ESLint accessibility rules as first line of defense
