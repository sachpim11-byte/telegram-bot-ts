# Gmail Code Reader

## Overview

A full-stack web application that automatically monitors Gmail for verification codes and forwards them to Telegram. The system uses Google OAuth2 for Gmail access, parses incoming emails for codes, stores found codes in a PostgreSQL database, and sends notifications via Telegram Bot API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite with React plugin

The frontend is a single-page application with a dashboard that displays:
- Bot status and controls (start/stop)
- Settings form for Telegram and Gmail configuration
- List of recently detected verification codes

### Backend Architecture
- **Runtime**: Node.js with TypeScript (tsx for development)
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Design**: REST endpoints defined in shared routes file with Zod validation

Key backend services:
- **BotService**: Manages email checking interval and Telegram notifications
- **Google Auth Service**: Handles OAuth2 flow for Gmail API access
- **Storage Layer**: Database abstraction using repository pattern

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Tables**:
  - `settings`: Stores Telegram credentials, Gmail configuration, and bot running state
  - `found_codes`: Logs detected verification codes with timestamps

### Authentication & Authorization
- **Gmail Access**: Google OAuth2 with offline access tokens stored in `token.json`
- **Scopes**: `gmail.readonly` for reading emails only

### External Service Integrations
- **Gmail API**: Uses Google APIs Node.js client for reading emails
- **Telegram Bot API**: Uses `node-telegram-bot-api` for sending notifications

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Page components
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── services/     # Business logic (bot, auth)
│   ├── routes.ts     # API endpoint handlers
│   └── storage.ts    # Database operations
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle table definitions
│   └── routes.ts     # API route definitions with Zod
└── migrations/       # Database migrations
```

### Development vs Production
- Development: Vite dev server with HMR, tsx for TypeScript execution
- Production: Vite builds static assets, esbuild bundles server to single file

## External Dependencies

### Third-Party Services
- **Google Cloud Platform**: OAuth2 client credentials for Gmail API access
- **Telegram Bot API**: Requires bot token and chat ID for notifications
- **PostgreSQL**: Database provisioned via Replit (requires DATABASE_URL)

### Key NPM Packages
- `googleapis`: Google APIs client library
- `node-telegram-bot-api`: Telegram bot integration
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Accessible UI primitives
- `zod`: Runtime type validation
- `express-session` / `connect-pg-simple`: Session management

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- Google OAuth credentials stored in `attached_assets/` directory
- OAuth tokens saved to `token.json` after authentication