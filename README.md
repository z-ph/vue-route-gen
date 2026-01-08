# @signlab/vue-route-gen

Vue 3 file-based route generator for Vue Router.

## Features

- Automatic route discovery from file structure
- Layout support (`layout.vue` or `layout/index.vue`)
- Dynamic route parameters (`$param` or `[param]`)
- Cache mechanism for fast rebuilds
- TypeScript support with generated types

## Installation

```bash
npm install @signlab/vue-route-gen
```

## Usage

### CLI

```bash
vue-route-gen
```

### Programmatic

```typescript
import { generateRoutes } from '@signlab/vue-route-gen';

// Generate routes with default options
generateRoutes();

// Or specify custom directories
generateRoutes({
  pagesDir: './src/pages',
  outFile: './src/router/route.gen.ts'
});
```

## File Structure

```
src/pages/
├── layout.vue              # Root layout
├── index.vue               # Home page (/)
├── about.vue               # About page (/about)
├── users/
│   ├── layout.vue          # Users layout (/users)
│   ├── index.vue           # Users list (/users)
│   └── [id].vue            # User detail (/users/:id)
└── $slug.vue               # Catch-all (/:slug)
```

## Configuration

### Options

- `pagesDir`: Pages directory path (default: `src/pages`)
- `outFile`: Output file path (default: `src/router/route.gen.ts`)

### Excluded Directories

The following directories are automatically excluded:
- `components`
- `hooks`
- `service`

## Generated Output

The generator creates:

1. `ROUTE_NAME` - Route name constants
2. `ROUTE_PATH` - Route path constants
3. `ROUTE_PATH_BY_NAME` - Path lookup by name
4. `routes` - Vue Router route records array

## License

MIT
