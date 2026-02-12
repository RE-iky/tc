# Project Structure

## Repository Layout

This is a monorepo containing both frontend and backend applications.

```
.
├── src/                    # Frontend React application
├── server/                 # Backend Node.js API
├── public/                 # Static assets
├── dist/                   # Frontend build output
└── .kiro/                  # Kiro configuration and specs
```

## Frontend Structure (`src/`)

### Organization Pattern
Feature-based organization with shared utilities and components.

```
src/
├── components/             # Reusable UI components
│   ├── AccessibilityDemo.tsx
│   ├── VideoPlayer.tsx
│   ├── SmartReader.tsx
│   ├── ImageGallery.tsx
│   ├── GlossaryPanel.tsx
│   └── *.css              # Component-specific styles
│
├── pages/                  # Route-level page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Home.tsx
│   ├── AccessibilitySelection.tsx
│   ├── Assignment.tsx
│   ├── TeacherDashboard.tsx
│   └── *.css              # Page-specific styles
│
├── store/                  # Zustand state management
│   ├── accessibility.ts   # Accessibility preferences
│   ├── auth.ts            # Authentication state
│   └── assignment.ts      # Assignment state
│
├── hooks/                  # Custom React hooks
│   └── useSmartReader.ts
│
├── services/               # API and external service integrations
│   └── mockAuth.ts
│
├── utils/                  # Utility functions
│   ├── contentExtractor.ts
│   ├── validation.ts
│   └── videoParser.ts
│
├── types/                  # TypeScript type definitions
│   └── index.ts
│
├── styles/                 # Global styles and themes
│   ├── index.css          # Global styles
│   └── themes.css         # Theme variables (accessibility modes)
│
├── App.tsx                 # Root application component
└── main.tsx                # Application entry point
```

### Component Naming Conventions
- **Components**: PascalCase (e.g., `VideoPlayer.tsx`)
- **Styles**: Match component name (e.g., `VideoPlayer.css`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSmartReader.ts`)
- **Utilities**: camelCase (e.g., `contentExtractor.ts`)

## Backend Structure (`server/`)

### Organization Pattern
MVC-inspired architecture with clear separation of concerns.

```
server/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── authController.ts
│   │   ├── courseController.ts
│   │   ├── userController.ts
│   │   ├── imageController.ts
│   │   └── subtitleController.ts
│   │
│   ├── routes/             # API route definitions
│   │
│   ├── services/           # Business logic
│   │   └── jobService.ts
│   │
│   ├── models/             # Data models
│   │   └── data.ts
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts
│   │   └── job.ts
│   │
│   ├── utils/              # Utility functions
│   │
│   ├── middleware/         # Express middleware
│   │
│   ├── scripts/            # Standalone scripts
│   │   └── whisper_local.py
│   │
│   └── index.ts            # Server entry point
│
├── dist/                   # Compiled JavaScript output
├── .env                    # Environment variables (not in git)
├── package.json
└── tsconfig.json
```

### Backend Conventions
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Define data structures
- **Routes**: Define API endpoints
- **Middleware**: Request processing pipeline

## Key Architectural Patterns

### Frontend Patterns
1. **Component Colocation**: Component styles live next to component files
2. **Path Aliases**: Use `@/` prefix for absolute imports from `src/`
3. **State Management**: Zustand stores for global state, local state for component-specific
4. **Accessibility First**: Every component must consider keyboard navigation and screen readers

### Backend Patterns
1. **Controller-Service Pattern**: Controllers handle HTTP, services handle logic
2. **Type Safety**: Shared types between frontend and backend where applicable
3. **Environment Configuration**: All secrets and config in `.env` files

## File Naming Conventions

### General Rules
- **TypeScript files**: `.ts` extension
- **React components**: `.tsx` extension
- **Styles**: `.css` extension (same name as component)
- **Tests**: `.test.ts` or `.test.tsx` (when implemented)

### Special Files
- `index.ts`: Barrel exports for cleaner imports
- `types/index.ts`: Centralized type definitions
- `App.tsx`: Root component
- `main.tsx`: Application entry point

## Import Conventions

### Frontend
```typescript
// External dependencies first
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Internal imports with @ alias
import { useAuth } from '@/store/auth';
import { VideoPlayer } from '@/components/VideoPlayer';
import type { Course } from '@/types';

// Relative imports for same directory
import './Component.css';
```

### Backend
```typescript
// External dependencies first
import express from 'express';
import cors from 'cors';

// Internal imports (relative paths)
import { authController } from './controllers/authController';
import type { User } from './types';
```

## Configuration Files

### Root Level
- `package.json`: Frontend dependencies and scripts
- `tsconfig.json`: Frontend TypeScript config
- `vite.config.ts`: Vite build configuration
- `.eslintrc.cjs`: ESLint rules (includes accessibility)

### Server Level
- `server/package.json`: Backend dependencies
- `server/tsconfig.json`: Backend TypeScript config
- `server/.env`: Environment variables (not committed)

## Accessibility Considerations

### Component Structure
Every interactive component should include:
- Semantic HTML elements
- ARIA labels where needed
- Keyboard event handlers
- Focus management
- Screen reader announcements

### Style Organization
- `styles/themes.css`: CSS variables for accessibility modes (high contrast, large text)
- Component styles: Scoped to component, use theme variables
- Global styles: Minimal, mainly resets and base typography
