#!/usr/bin/env node

import { program } from 'commander'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { serverTemplate } from './nextjs-template/server.ts'
import { providerTemplate, chatComponentTemplate } from './nextjs-template/components.ts'
import { tsconfigServerTemplate } from './nextjs-template/tsconfig.ts'

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

async function setupNextjs() {
  try {
    // Create server file
    await createFile(
      path.join(process.cwd(), 'server.ts'),
      serverTemplate
    )

    // Create components
    await createFile(
      path.join(process.cwd(), 'app/_components/SocketProvider.tsx'),
      providerTemplate
    )
    await createFile(
      path.join(process.cwd(), 'app/_components/Chat.tsx'),
      chatComponentTemplate
    )

    // Create tsconfig.server.json
    await createFile(
      path.join(process.cwd(), 'tsconfig.server.json'),
      tsconfigServerTemplate
    )

    // Update package.json
    await updatePackageJson()

    console.log('\nInstalling additional dependencies...')
    const { execSync } = await import('child_process')
    execSync('npm install ts-node @types/node socket.io @types/socket.io --save-dev', { stdio: 'inherit' })

    console.log('\n✅ Setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update your app/layout.tsx to include the SocketProvider')
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
  .action(setupNextjs)

program.parse(process.argv)
