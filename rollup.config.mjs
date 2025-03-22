import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { dts } from 'rollup-plugin-dts';
import { readFileSync } from 'fs';
import json from '@rollup/plugin-json';

const packageJson = JSON.parse(readFileSync('./package.json'));

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
    external: ['react', 'react-dom', 'socket.io-client'],
  },
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
  {
    input: 'cli/index.ts',
    output: {
      file: 'dist/cli/index.js',
      format: 'esm'
    },
    external: ['commander', 'fs/promises', 'path', 'url', 'child_process'],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      json()
    ]
  }
];