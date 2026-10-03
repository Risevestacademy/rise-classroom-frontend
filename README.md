# Rise Academy Classroom

The frontend for the Rise Academy classroom platform, built with [Next.js](https://nextjs.org).

---

## Tech Stack & Key Tools

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (`tw-animate-css` for animations)
- **UI Components:** Base UI (`@base-ui/react`) / shadcn/ui primitives, `class-variance-authority`
- **Icons:** Lucide React (`lucide-react`)
- **Forms & Validation:** React Hook Form, Zod, `@hookform/resolvers`
- **Data Fetching:** TanStack React Query
- **Charts:** Recharts
- **Phone Inputs:** `libphonenumber-js`, `country-flag-icons`
- **Monitoring & Analytics:** Sentry (`@sentry/nextjs`), Microsoft Clarity
- **Testing:** Vitest, Testing Library, jsdom
- **Linting & Formatting:** ESLint 9, Prettier

---

## Getting Started

This project uses **pnpm** as the standard package manager. Ensure Node.js (v20+ recommended) and pnpm are installed on your machine.

```bash
# Install pnpm (if you don't have it)
npm install -g pnpm

# Install dependencies
pnpm install

# Start local dev server
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Start the local development server   |
| `pnpm build`      | Create a production build            |
| `pnpm start`      | Run the production build             |
| `pnpm lint`       | Lint the codebase with ESLint        |
| `pnpm test`       | Run the test suite once (Vitest)     |
| `pnpm test:watch` | Run tests in watch mode              |

---

## Project Structure

```
├── .github/workflows/      # GitHub CI workflows (and pull request template)
├── app/                    # Next.js App Router (pages, layouts)
├── assets/                 # Project assets (images, fonts, etc.)
├── components/             # Reusable UI components
│   └── ui/                 # Base shadcn/ui primitives (Avatar, Button, Input, etc.)
├── lib/                    # Helper utilities (`cn`, formatters)
├── public/                 # Static image assets and icons
├── .gitignore
├── AGENTS.md               # Guidelines for AI coding agents
├── CLAUDE.md               # Claude-specific project instructions
├── GitWorkflow.md          # Git branching and contribution workflow
├── README.md
├── components.json         # shadcn/ui configuration
├── eslint.config.mjs       # ESLint configuration
├── instrumentation-client.ts  # Client-side instrumentation (Sentry)
└── instrumentation.ts      # Server-side instrumentation (Sentry)
```

---

## Contributing

Please read [`GitWorkflow.md`](./GitWorkflow.md) for the branching strategy, commit conventions, and pull request process before contributing. AI-assisted contributions should follow the guidelines in [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md).

---

## Deployment

The application is deployed at [rise-classroom-frontend.netlify.app](https://rise-classroom-frontend.netlify.app).

During development, changes to the source files are reflected automatically in your browser.

---