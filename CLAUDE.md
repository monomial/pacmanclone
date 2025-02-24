# PacManClone Development Guide

## Commands
- Start: `npx expo start`
- Test: `npm test`
- Test single: `npm test -- -t "YourTestName"`
- Lint: `expo lint`
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`
- Reset demo: `npm run reset-project`

## Code Style
- Strict TypeScript with explicit types for props/state/returns
- Import order: React, RN, external libs, project files, styles
- Use @/ path alias for imports from project root
- Component pattern: React.FC with interface for props
- Styling: StyleSheet.create() for all styles
- Colors in constants/Colors.ts
- Use ThemedText/ThemedView for theme-aware components
- Handle errors with try/catch and descriptive messages
- Animations with React Native Animated API
- File naming: PascalCase for components, camelCase for utilities

## Architecture
- Expo Router with file-based routing
- Core game logic in src/ directory
- UI components in components/ directory
- Constants in dedicated files with TS const assertions