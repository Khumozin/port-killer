# PortKiller

[![CI](https://github.com/Khumozin/port-killer/actions/workflows/ci.yml/badge.svg)](https://github.com/Khumozin/port-killer/actions/workflows/ci.yml)
[![Release](https://github.com/Khumozin/port-killer/actions/workflows/release.yml/badge.svg)](https://github.com/Khumozin/port-killer/actions/workflows/release.yml)
[![Bundle Size](https://github.com/Khumozin/port-killer/actions/workflows/bundle-size.yml/badge.svg)](https://github.com/Khumozin/port-killer/actions/workflows/bundle-size.yml)

A desktop application to manage and kill processes running on specific ports. Built with Angular 21 and Tauri 2.

## Development

### Angular Development Server

To start the Angular development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Tauri Development

To run the full Tauri application in development mode:

```bash
npm run tauri:dev
```

This will start both the Angular dev server and the Tauri desktop application.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

### Angular Build

To build the Angular application:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/port-killer/browser/` directory.

### Tauri Build

To build the Tauri desktop application with installers:

```bash
npm run tauri:build
```

This will create platform-specific installers in the `src-tauri/target/release/bundle/` directory:
- **macOS**: `.dmg` file
- **Linux**: `.deb` and `.AppImage` files

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
