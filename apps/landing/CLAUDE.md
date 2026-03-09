# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 landing page for Tenista.app - a tennis app that helps players find partners, join flex leagues, and participate in tournaments. The project uses the App Router architecture with TypeScript and Tailwind CSS v4.

## Development Commands

- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build production version (includes linting and type checking)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Architecture & Structure

**App Router Structure:**
- `app/layout.tsx` - Root layout with Geist font configuration and global styling
- `app/page.tsx` - Single-page landing site with all sections (hero, features, how-it-works, CTA, footer)
- `app/globals.css` - Tailwind CSS v4 imports with custom CSS variables for theming

**Styling System:**
- Uses Tailwind CSS v4 with inline theme configuration and comprehensive design system
- Enhanced CSS theme with OKLCH color space for better color consistency
- Complete design token system including colors, radius, sidebar, chart variables
- Dark mode support via custom `.dark` class variant and CSS custom properties
- Animation library integrated via `tw-animate-css`
- Utility libraries: `clsx` for conditional classes, `tailwind-merge` for class merging
- Icons from `lucide-react` library
- `class-variance-authority` for component variant management

**Key Design Patterns:**
- Single-page application with section-based navigation
- Component structure uses semantic HTML with Tailwind utility classes
- Lucide React icons for consistent iconography
- Gradient backgrounds and hover effects for interactive elements
- Design system ready for component library expansion with CVA

## Content Structure

The landing page follows this section order:
1. Navigation (Tenista logo, feature links, CTA button)
2. Hero (main value proposition, dual CTA buttons)
3. Features (3-column grid: Find Partners, Flex Leagues, Tournaments)
4. How It Works (3-step process)
5. Call-to-Action (download section with iOS/Android buttons)
6. Footer (4-column links + copyright)

## TypeScript Configuration

- Strict mode enabled with ES2017 target
- Path mapping configured for `@/*` imports (though not currently used)
- Next.js plugin enabled for enhanced TypeScript support

## UI Library Stack

The project includes modern UI development utilities:
- **Icons:** `lucide-react` - Consistent, customizable icon library
- **Styling Utilities:** `clsx` for conditional classes, `tailwind-merge` for class deduplication
- **Component Variants:** `class-variance-authority` (CVA) for type-safe component API design
- **Animations:** `tw-animate-css` integration with Tailwind CSS
- **Design System:** Comprehensive OKLCH-based color tokens with light/dark mode support