export const tsconfigServerTemplate = `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "dist",
    "noEmit": false,
    "jsx": "react"
  },
  "include": ["server.ts"]
}`
