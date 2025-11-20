# Web Admin (TailAdmin V2)

This is a standalone Next.js application based on **TailAdmin V2** design system. It serves as a testing ground for the new design system before migrating existing functionalities from the `web` app.

## Purpose

This app was created to:
- Test and validate TailAdmin V2 design system integration
- Ensure all components and features work correctly in the monorepo environment
- Provide a reference implementation before migrating existing features
- Serve as the new admin panel once migration is complete

## Tech Stack

- **Framework**: Next.js 15
- **UI Library**: TailAdmin V2 (React 19)
- **Styling**: TailwindCSS 4.0
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Getting Started

### Development

Run the development server:

```bash
# From root directory
make web-admin

# Or directly
cd apps/web-admin
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Build

Build the production version:

```bash
npm run build
```

### Testing

Run tests:

```bash
npm run test
```

## Project Structure

```
apps/web-admin/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── icons/            # SVG icons
│   ├── layout/           # Layout components
│   └── utils/            # Utility functions
├── public/               # Static assets
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Key Features

TailAdmin V2 includes:
- Modern dashboard layouts
- Advanced chart components (ApexCharts)
- Calendar integration (FullCalendar)
- Form components with validation
- Data tables
- UI components (modals, alerts, tabs, etc.)
- Interactive maps (jVectorMap)
- File upload with drag-and-drop
- And more...

## Integration with Monorepo

This app follows the project's architectural guidelines:
- ✅ Uses TanStack Query for data fetching
- ✅ Uses Zustand for state management
- ✅ Uses TailwindCSS for styling
- ✅ Includes testing setup with Jest and React Testing Library
- ✅ Follows SOLID principles
- ✅ No `any` types (uses `unknown` instead)
- ✅ Integrated with Turbo for monorepo builds

## Next Steps

1. Verify all TailAdmin V2 components work correctly
2. Integrate with the API (`apps/api`)
3. Migrate existing features from `apps/web`
4. Add authentication and authorization
5. Implement RBAC integration
6. Add comprehensive tests

## Notes

- Uses `--legacy-peer-deps` for installation due to React 19 compatibility with some dependencies
- Default port is 3000 (same as `web` app, so only one can run at a time)
- To run on a different port: `PORT=3001 npm run dev`
