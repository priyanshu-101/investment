# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an **Expo React Native** application built with TypeScript, using **expo-router** for file-based navigation. The app supports iOS, Android, and Web platforms with a modern cross-platform architecture.

### Key Technologies
- **Expo SDK 54** - Cross-platform development framework
- **React Native 0.81.4** with **React 19.1.0**
- **TypeScript** with strict type checking
- **expo-router 6.0** - File-based routing system
- **React Navigation** - Tab and stack navigation
- **Reanimated 4.1** - Animations and gestures

## Development Commands

### Core Commands
```bash
# Install dependencies
npm install

# Start development server (choose platform when prompted)
npm start
# or
npx expo start

# Platform-specific starts
npm run android    # Start for Android
npm run ios        # Start for iOS
npm run web        # Start for web

# Lint code
npm run lint

# Reset project to blank state (moves current code to app-example/)
npm run reset-project
```

### Build Commands
```bash
# Web static export (outputs to dist/ per app.json web.output)
npx expo export --platform web --output dist

# Generate native projects (ios/ and android/) if you need to run Xcode/Android Studio
npx expo prebuild

# Run on device/emulator with native projects (after prebuild)
npx expo run:android
npx expo run:ios
```

### Testing
- No test tooling or npm test script is currently configured in package.json.
- If you add Jest or another test runner later, document the usage here (including how to run a single test).

### Development Workflow
- Use `npx expo start` and scan QR code with Expo Go app for quick testing
- Press `cmd + d` (iOS) / `cmd + m` (Android) / `F12` (web) for developer tools
- Hot reload is enabled by default - save files to see changes instantly

## Architecture

### Directory Structure
```
app/                    # File-based routing (expo-router)
  (tabs)/              # Tab group routes
    _layout.tsx        # Tab navigation setup
    index.tsx          # Home screen
    explore.tsx        # Explore screen
  _layout.tsx          # Root layout with theme provider
  modal.tsx            # Modal screen

components/            # Reusable UI components
  ui/                  # Base UI components (IconSymbol, Collapsible)
  themed-*.tsx         # Theme-aware components
  haptic-tab.tsx       # Custom tab with haptic feedback

constants/
  theme.ts             # Colors and fonts for light/dark themes

hooks/
  use-*.ts             # Custom hooks for theme, color scheme

assets/
  images/              # App icons, splash screens, images
```

### Routing Architecture
- **File-based routing** with expo-router - file structure determines URL structure
- **Stack navigation** at root level with tab navigation nested inside
- **Typed routes** enabled via experiments.typedRoutes in app.json
- **Modal presentation** available via stack screen options

### Theme System
- **Automatic light/dark mode** support via `useColorScheme` hook
- **Themed components** (`ThemedText`, `ThemedView`) automatically adapt to current theme
- **Platform-specific fonts** defined in `constants/theme.ts`
- **Consistent color palette** across all platforms

### Component Patterns
- **Themed components**: Use `ThemedText` and `ThemedView` instead of base React Native components
- **Haptic feedback**: Custom tab component provides tactile feedback on iOS
- **IconSymbol**: Cross-platform icon system with SF Symbols on iOS
- **ParallaxScrollView**: Reusable scrollable header component

## Configuration Files

### Key Configuration
- **app.json**: Expo configuration with new architecture enabled (`newArchEnabled: true`)
- **tsconfig.json**: TypeScript with strict mode and path aliases (`@/*` maps to `./`)
- **eslint.config.js**: Expo's ESLint configuration with flat config format
- **.vscode/settings.json**: Auto-fix on save, organize imports, sort members

### Path Aliases
- `@/` - Root directory alias for clean imports (e.g., `@/components/themed-text`)

## Development Notes

### Platform Differences
- **iOS**: Uses SF Symbols for icons, system fonts, supports tablets
- **Android**: Edge-to-edge UI enabled, adaptive icon system, predictive back gesture disabled
- **Web**: Static output build, includes PWA favicon

### New Expo Features Used
- **New Architecture** enabled for improved performance
- **React Compiler** experimental support for automatic optimizations
- **Typed Routes** for type-safe navigation

### Starting Fresh
When ready to begin actual development, run `npm run reset-project` to:
- Move example code to `app-example/` directory  
- Create clean `app/` directory with basic index and layout files
- Preserve current starter code for reference
