#!/usr/bin/env node

import { program } from 'commander'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { serverTemplate } from './nextjs-template/server'
import { providerTemplate, chatComponentTemplate } from './nextjs-template/components'
import { tsconfigServerTemplate } from './nextjs-template/tsconfig'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function createFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
  console.log(`Created ${filePath}`)
}

async function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

  packageJson.scripts = {
    ...packageJson.scripts,
    "dev": "ts-node --project tsconfig.server.json server.ts",
    "start": "NODE_ENV=production ts-node --project tsconfig.server.json server.ts"
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('Updated package.json')
}

async function detectPackageManager() {
  try {
    // Check for lock files to determine the package manager
    const files = await fs.readdir(process.cwd());
    if (files.includes('yarn.lock')) return 'yarn';
    if (files.includes('pnpm-lock.yaml')) return 'pnpm';
    // Default to npm (or if package-lock.json exists)
    return 'npm';
  } catch (error) {
    return 'npm'; // Default to npm if detection fails
  }
}

async function installDependencies(packageManager: string) {
  const { execSync } = await import('child_process');
  const dependencies = 'ts-node @types/node socket.io @types/socket.io';
  
  const commands: Record<string, string> = {
    npm: `npm install ${dependencies} --save-dev`,
    yarn: `yarn add ${dependencies} --dev`,
    pnpm: `pnpm add ${dependencies} --save-dev`
  };

  const command = commands[packageManager] || commands.npm;
  console.log(`Installing with ${packageManager}...`);
  execSync(command, { stdio: 'inherit' });
}

async function detectAppDirectory() {
  try {
    const files = await fs.readdir(process.cwd());
    
    // Check if src directory exists
    if (files.includes('src')) {
      // Check if src/app exists
      const srcFiles = await fs.readdir(path.join(process.cwd(), 'src'));
      if (srcFiles.includes('app')) {
        return path.join('src', 'app');
      }
    }
    
    // Check if app directory exists at root
    if (files.includes('app')) {
      return 'app';
    }
    
    // If neither exists, default to app (will be created)
    return 'app';
  } catch (error) {
    // Default to app in case of any errors
    return 'app';
  }
}

async function loadConfig() {
  try {
    const configPath = path.join(process.cwd(), 'react-socketeer.json');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (configExists) {
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    }
    
    return {};
  } catch (error) {
    console.warn('Warning: Could not load configuration file. Using defaults.');
    return {};
  }
}

async function setupNextjs(options: { packageManager?: string }) {
  try {
    // Load user configuration
    const config = await loadConfig();
    
    // Create server file
    await createFile(
      path.join(process.cwd(), 'server.ts'),
      serverTemplate
    )

    // Detect app directory structure
    const appDir = await detectAppDirectory();
    console.log(`Detected app directory: ${appDir}`);

    // Create components
    await createFile(
      path.join(process.cwd(), `${appDir}/_components/SocketProvider.tsx`),
      providerTemplate
    )
    await createFile(
      path.join(process.cwd(), `${appDir}/_components/Chat.tsx`),
      chatComponentTemplate
    )

    // Create tsconfig.server.json
    await createFile(
      path.join(process.cwd(), 'tsconfig.server.json'),
      tsconfigServerTemplate
    )

    // Update package.json
    await updatePackageJson()

    // Install dependencies with the appropriate package manager
    const packageManager = options.packageManager || await detectPackageManager();
    console.log('\nInstalling additional dependencies...');
    await installDependencies(packageManager);

    console.log('\n✅ Setup completed successfully!')
    console.log('\nNext steps:')
    console.log(`1. Update your ${appDir}/layout.tsx to include the SocketProvider`)
    console.log('2. Create your pages using the Chat components')
    console.log('3. Run npm run dev to start the development server')
  } catch (error) {
    console.error('Error during setup:', error)
    process.exit(1)
  }
}

program
  .command('setup-nextjs')
  .description('Set up Next.js configuration for react-socketeer')
  .option('-p, --package-manager <manager>', 'specify package manager (npm, yarn, or pnpm)')
  .action(setupNextjs)

program.parse(process.argv)
