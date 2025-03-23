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

async function installAdapterDependencies(packageManager: string, adapterConfig: any) {
  const { execSync } = await import('child_process');
  
  let dependencies = '';
  
  if (adapterConfig.type === 'redis') {
    dependencies = '@socket.io/redis-adapter redis';
  } 
  else if (adapterConfig.type === 'mongo' || adapterConfig.type === 'mongodb') {
    dependencies = '@socket.io/mongo-adapter mongodb';
  }
  else if (adapterConfig.type === 'postgres' || adapterConfig.type === 'postgresql') {
    dependencies = '@socket.io/postgres-adapter pg';
  }
  else if (adapterConfig.dependencies && Array.isArray(adapterConfig.dependencies)) {
    dependencies = adapterConfig.dependencies.join(' ');
  }
  
  if (dependencies) {
    const commands: Record<string, string> = {
      npm: `npm install ${dependencies} --save`,
      yarn: `yarn add ${dependencies}`,
      pnpm: `pnpm add ${dependencies}`
    };

    const command = commands[packageManager] || commands.npm;
    console.log(`Installing adapter dependencies with ${packageManager}...`);
    try {
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Adapter dependencies installed successfully');
    } catch (error) {
      console.error('Failed to install adapter dependencies:', error);
      console.warn('You may need to install them manually:');
      console.warn(`${packageManager} install ${dependencies}`);
    }
  }
}

// Function to generate the appropriate server template based on configuration
async function generateServerTemplate(config: any) {
  // Start with the base template
  let template = `import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer, Socket } from 'socket.io'
import fs from 'fs'
import path from 'path'

// Extend the Socket interface to add our custom properties
declare module 'socket.io' {
  interface Socket {
    username?: string;
  }
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Initialize Socket.IO with basic configuration
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })`;

  // Add adapter configuration if specified
  if (config?.adapter) {
    const adapterType = config.adapter.type;
    
    if (adapterType === 'redis') {
      template += `
  
  // Set up Redis adapter
  try {
    console.log('Setting up Redis adapter...');
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');
    
    const pubClient = createClient(${JSON.stringify(config.adapter.options || {})});
    const subClient = pubClient.duplicate();
    
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Redis adapter set up successfully');
    }).catch(err => {
      console.error('Redis adapter connection failed:', err);
      console.warn('Falling back to in-memory adapter');
    });
  } catch (error) {
    console.error('Failed to set up Redis adapter:', error);
    console.warn('Make sure you have installed required dependencies:');
    console.warn('npm install @socket.io/redis-adapter redis');
  }`;
    } 
    else if (adapterType === 'mongo' || adapterType === 'mongodb') {
      template += `
  
  // Set up MongoDB adapter
  try {
    console.log('Setting up MongoDB adapter...');
    const { createAdapter } = require('@socket.io/mongo-adapter');
    const { MongoClient } = require('mongodb');
    
    const mongoClient = new MongoClient('${config.adapter.uri}');
    mongoClient.connect().then(() => {
      const mongoCollection = mongoClient
        .db('${config.adapter.dbName || 'socketio'}')
        .collection('${config.adapter.collection || 'socket.io-adapter-events'}');
      
      io.adapter(createAdapter(mongoCollection));
      console.log('MongoDB adapter set up successfully');
    }).catch(err => {
      console.error('MongoDB connection failed:', err);
      console.warn('Falling back to in-memory adapter');
    });
  } catch (error) {
    console.error('Failed to set up MongoDB adapter:', error);
    console.warn('Make sure you have installed required dependencies:');
    console.warn('npm install @socket.io/mongo-adapter mongodb');
  }`;
    }
    else if (adapterType === 'custom' && config.adapter.setupFunction) {
      template += `
  
  // Set up custom adapter
  try {
    console.log('Setting up custom adapter...');
    const setupAdapter = require('${config.adapter.setupFunction}');
    setupAdapter.default(io, ${JSON.stringify(config.adapter)})
      .then(() => console.log('Custom adapter set up successfully'))
      .catch(err => {
        console.error('Custom adapter setup failed:', err);
        console.warn('Falling back to in-memory adapter');
      });
  } catch (error) {
    console.error('Failed to set up custom adapter:', error);
    console.warn('Check your custom adapter implementation and dependencies');
  }`;
    }
    else {
      template += `
  
  // No recognized adapter type specified, using in-memory adapter
  console.log('Using default in-memory adapter. Adapter type "${adapterType}" not recognized.');`;
    }
  } else {
    template += `
  
  // No adapter configured, using in-memory adapter
  console.log('Using default in-memory adapter');`;
  }

  // Add the rest of the server code
  template += `

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('login', (username) => {
      socket.username = username
      io.emit('login_success', { username, id: socket.id })
    })

    socket.on('send_message', (message) => {
      io.emit('new_message', {
        username: socket.username,
        text: message,
        timestamp: Date.now()
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  server.listen(port, () => {
    console.log(\`> Ready on http://\${hostname}:\${port}\`)
  })
})`;

  return template;
}

async function setupNextjs(options: { packageManager?: string }) {
  try {
    // Load user configuration
    const config = await loadConfig();
    
    // Generate server template based on configuration
    const serverTemplate = await generateServerTemplate(config);
    
    // Create server file
    await createFile(
      path.join(process.cwd(), 'server.ts'),
      serverTemplate
    );

    // Detect app directory structure
    const appDir = await detectAppDirectory();
    console.log(`Detected app directory: ${appDir}`);

    // Create components
    await createFile(
      path.join(process.cwd(), `${appDir}/_components/SocketProvider.tsx`),
      providerTemplate
    );
    await createFile(
      path.join(process.cwd(), `${appDir}/_components/Chat.tsx`),
      chatComponentTemplate
    );

    // Create tsconfig.server.json
    await createFile(
      path.join(process.cwd(), 'tsconfig.server.json'),
      tsconfigServerTemplate
    );

    // Update package.json
    await updatePackageJson();

    // Install dependencies with the appropriate package manager
    const packageManager = options.packageManager || await detectPackageManager();
    console.log('\nInstalling additional dependencies...');
    await installDependencies(packageManager);
    
    // Install adapter dependencies if configured
    if (config.adapter) {
      console.log('\nInstalling adapter dependencies...');
      await installAdapterDependencies(packageManager, config.adapter);
    }

    console.log('\n✅ Setup completed successfully!');
    console.log('\nNext steps:');
    console.log(`1. Update your ${appDir}/layout.tsx to include the SocketProvider`);
    console.log('2. Create your pages using the Chat components');
    console.log('3. Run npm run dev to start the development server');
    
    if (!config.adapter) {
      console.log('\nℹ️ To configure a scalable adapter for Socket.IO:');
      console.log('1. Create a react-socketeer.json file in your project root');
      console.log('2. Add adapter configuration (see documentation for examples)');
    }
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

program
  .command('setup-nextjs')
  .description('Set up Next.js configuration for react-socketeer')
  .option('-p, --package-manager <manager>', 'specify package manager (npm, yarn, or pnpm)')
  .action(setupNextjs)

program.parse(process.argv)
