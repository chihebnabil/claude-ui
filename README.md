# Claude UI

**Self-hosted Claude interface for enterprises.** Run Anthropic's Claude on your infrastructure with your API keys—no rate limits, no data leakage, full audit control.

[![GitHub stars](https://img.shields.io/github/stars/chihebnabil/claude-ui?style=social)](https://github.com/yourusername/claude-ui)
[![License](https://img.shields.io/badge/license-AGPL-blue)](LICENSE)
[![Enterprise](https://img.shields.io/badge/enterprise-available-green)](mailto:hi@remoteskills.io)

## Why Claude UI?

- **Escape Claude's 5-hour limits** – Your team works 8+ hours. Don't let Anthropic's rate limits block deployments.
- **Zero data leakage** – Code, documents, and chat history stay on your servers (SOC 2 friendly).
- **BYOK economics** – Bring your own Anthropic API key. No per-seat markup. Scale 50 users for the price of 1.
- **Deploy anywhere** – Docker, Vercel, AWS, or on-premise.

## Two Editions

### Community Edition (Free)
The open-source Nuxt.js version. Perfect for individual developers and small teams comfortable with self-hosting.

**Features:**
- Unlimited conversations (BYOK)
- Local SQLite database
- Markdown & code syntax highlighting
- PDF/text extraction
- Light/Dark mode

[View Community Docs →](#community-setup)

### Enterprise Edition (Licensed)
The production-ready Next.js version built for organizations.

**Additional Features:**
- **SSO/SAML** (Google Workspace, Okta, Azure AD)
- **Audit logging** – Full prompt/response history for compliance
- **Multi-tenant workspaces** – Isolate teams by department
- **Custom branding** – White-label with your logo
- **Priority support** – Direct email/Slack support
- **Managed deployment** – We deploy to your VPC in 48 hours


**[Email hi@remoteskills.io for enterprise license →](mailto:hi@remoteskills.io?subject=Claude%20UI%20Enterprise%20Inquiry)**

---

## Community Edition Setup
**Tech Stack:** Nuxt 3, Drizzle ORM, SQLite, Tailwind CSS

### Prerequisites
- Node.js 18+
- Anthropic API key
- 1GB RAM minimum

<p align="center">
  <img src="./public/ui.png" alt="Claude UI Screenshot">
</p>

## 🌟 Features

- 💾 Conversation history management
- 🎭 Multiple Claude model support
- 📝 Markdown and code syntax highlighting
- 🌙 Dark/Light mode toggle
- 🤖 Personlize behavior using system prompts for each chat
- 🎯 Limit output tokens for each chat
- 🔄 Custome temperature (Randomness) for each chat
- 📎💾 Prompt Caching for attachments
- 📝🔍 Text extraction and parsing

## Tech Stack

- 🚀 Built with [Nuxt 3](https://nuxt.com/)
- 💾 Database integration with [Drizzle ORM](https://orm.drizzle.team/)
- 🎨 UI components from [@nuxt/ui](https://ui.nuxt.com/)
- 🤖 AI integration with [@anthropic-ai/sdk](https://www.anthropic.com/)
- 📝 Text extraction capabilities with [@nosferatu500/textract](https://www.npmjs.com/package/@nosferatu500/textract)
- ✨ Markdown support with [markdown-it](https://github.com/markdown-it/markdown-it)
- 🎯 Code highlighting with [highlight.js](https://highlightjs.org/)

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

## Environment Configuration

Create a `.env` file in the root directory and add your Anthropic API key:

```bash
# Required: Get your API key from https://console.anthropic.com/
ANTHROPIC_KEY=your_anthropic_api_key_here

# Optional: Custom database path (defaults to ./database.db)
DATABASE_URL=./database.db
```

**To get your Anthropic API key:**

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

## Parsing PDFs

Ensure `poppler-utils` is part of your environment by installing it:

```bash
sudo apt update
sudo apt install poppler-utils
```

## ENV

Create a .env file in the root directory and add your `ANTHROPIC_KEY` API key as shown above in the Setup section.

## Development Server

Start the development server on http://localhost:3000:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build
```

## Database

The application uses a SQLite database to store thread and message data.

### Database Management

This project uses Drizzle ORM for database management. Available commands:

```bash
# Generate database schema
npm run db:generate

# Migrate database schema
npm run db:migrate
```

## Enterprise Deployment
- For organizations requiring SSO, audit logs, and SLA support:
- Email hi@remoteskills.io with your team size
- Receive Docker Compose manifest + license key
- Deploy to your infrastructure (AWS, GCP, Azure, or on-premise)
- Configure SSO in 10 minutes
- Typical deployment: 1-2 hours for IT teams, or we handle it for you with the DFY package.

## Data Privacy & Compliance
Unlike cloud AI chat services:
- No training data retention – Anthropic never sees your data (BYOK)
- Self-hosted – Chat history stays in your database
- Audit trails – Enterprise edition logs all access (GDPR/SOX ready)
