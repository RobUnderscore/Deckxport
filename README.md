# Deckxport

A modern, production-ready MTG deck management tool built with React, TypeScript, and Vite.

## Features

- ⚡ **Lightning Fast** - Built with Vite for instant hot module replacement and optimized builds
- 🎨 **Modern UI** - Beautiful components powered by shadcn/ui and Tailwind CSS
- 🔧 **Type Safe** - Full TypeScript support with strict type checking
- 📱 **Responsive** - Works seamlessly on desktop and mobile devices
- 🚀 **GitHub Pages Ready** - Automated deployment with GitHub Actions
- 🔍 **Smart Data Fetching** - Powered by TanStack Query for efficient caching and state management

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query
- **Deployment**: GitHub Pages via GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Deckxport.git
cd Deckxport
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── services/        # API and external service integrations
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── styles/          # Global styles and CSS
```

## Adding Components

This project uses shadcn/ui for UI components. To add a new component:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add card
npx shadcn@latest add dialog
```

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing code style (enforced by ESLint and Prettier)
- Use absolute imports with the `@/` prefix

### Component Guidelines

- Keep components small and focused
- Use composition over inheritance
- Implement proper TypeScript interfaces for props
- Use shadcn/ui components where possible

### State Management

- Use React Query for server state
- Use React's built-in state for local component state
- Consider Zustand or Redux Toolkit for complex client state (if needed)

## Deployment

The app is automatically deployed to GitHub Pages when you push to the `main` branch.

### Manual Deployment

To deploy manually:

```bash
npm run build
```

The build output will be in the `dist` directory.

### GitHub Pages Setup

1. Go to your repository settings
2. Navigate to Pages section
3. Set source to "GitHub Actions"
4. The workflow will automatically deploy on push to main

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Base URL for the API | No |
| `VITE_PUBLIC_API_KEY` | Public API key | No |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | No |
| `VITE_ENABLE_DEBUG` | Enable debug mode | No |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Guidelines

- Use conventional commits format
- Keep commits atomic and focused
- Write clear, descriptive commit messages

## Troubleshooting

### Common Issues

**Build fails on GitHub Actions**
- Ensure all dependencies are in `package.json` (not devDependencies if needed for build)
- Check that the base URL is correctly configured in `vite.config.ts`

**Components not found**
- Verify path aliases are configured in both `tsconfig.json` and `vite.config.ts`
- Restart the dev server after configuration changes

**Styles not applying**
- Ensure Tailwind CSS is imported in `src/styles/globals.css`
- Check that PostCSS is configured correctly

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Vite](https://vitejs.dev/) for the blazing fast build tool
- [TanStack Query](https://tanstack.com/query) for powerful data synchronization