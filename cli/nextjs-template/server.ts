export const serverTemplate = `import { createServer } from 'http'
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

// Check if module exists without importing it
async function moduleExists(moduleName: string): Promise<boolean> {
  try {
    require.resolve(moduleName);
    return true;
  } catch (error) {
    return false;
  }
}

// Load configuration if exists
async function loadAdapterConfig() {
  try {
    const configPath = path.join(process.cwd(), 'react-socketeer.json');
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return configData.adapter || null;
    }
    return null;
  } catch (error) {
    console.warn('Warning: Error loading adapter config:', error);
    return null;
  }
}

// Setup Redis adapter if available
async function setupRedisAdapter(io: SocketIOServer, config: any) {
  if (!await moduleExists('@socket.io/redis-adapter') || !await moduleExists('redis')) {
    console.error('Redis adapter packages not found. Please install:');
    console.error('npm install @socket.io/redis-adapter redis');
    return false;
  }
  
  try {
    // These imports are only executed if the modules exist
    const redisAdapter = await import('@socket.io/redis-adapter');
    const redis = await import('redis');
    
    const pubClient = redis.createClient(config.options || {});
    const subClient = pubClient.duplicate();
    
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(redisAdapter.createAdapter(pubClient, subClient));
    
    console.log('Redis adapter set up successfully');
    return true;
  } catch (error) {
    console.error('Failed to set up Redis adapter:', error);
    return false;
  }
}

// Setup MongoDB adapter if available
async function setupMongoAdapter(io: SocketIOServer, config: any) {
  if (!await moduleExists('@socket.io/mongo-adapter') || !await moduleExists('mongodb')) {
    console.error('MongoDB adapter packages not found. Please install:');
    console.error('npm install @socket.io/mongo-adapter mongodb');
    return false;
  }
  
  try {
    // These imports are only executed if the modules exist
    const mongoAdapter = await import('@socket.io/mongo-adapter');
    const mongodb = await import('mongodb');
    
    const mongoClient = new mongodb.MongoClient(config.uri);
    await mongoClient.connect();
    
    const mongoCollection = mongoClient
      .db(config.dbName || 'socketio')
      .collection(config.collection || 'socket.io-adapter-events');
    
    io.adapter(mongoAdapter.createAdapter(mongoCollection));
    console.log('MongoDB adapter set up successfully');
    return true;
  } catch (error) {
    console.error('Failed to set up MongoDB adapter:', error);
    return false;
  }
}

// Setup custom adapter if available
async function setupCustomAdapter(io: SocketIOServer, config: any) {
  if (!config.setupFunction) {
    console.error('Custom adapter missing setupFunction path');
    return false;
  }
  
  try {
    if (!await moduleExists(config.setupFunction)) {
      console.error('Custom adapter setup module not found:', config.setupFunction);
      return false;
    }
    
    const setupModule = await import(config.setupFunction);
    await setupModule.default(io, config);
    console.log('Custom adapter set up successfully');
    return true;
  } catch (error) {
    console.error('Failed to set up custom adapter:', error);
    return false;
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
  })
  
  // Set up adapter if configured
  const adapterConfig = await loadAdapterConfig();
  if (adapterConfig) {
    let adapterSetupSuccess = false;
    
    console.log(\`Setting up \${adapterConfig.type} adapter...\`);
    
    if (adapterConfig.type === 'redis') {
      adapterSetupSuccess = await setupRedisAdapter(io, adapterConfig);
    } 
    else if (adapterConfig.type === 'mongo' || adapterConfig.type === 'mongodb') {
      adapterSetupSuccess = await setupMongoAdapter(io, adapterConfig);
    }
    else if (adapterConfig.type === 'custom') {
      adapterSetupSuccess = await setupCustomAdapter(io, adapterConfig);
    }
    
    if (!adapterSetupSuccess) {
      console.warn('Falling back to in-memory adapter');
    }
  } else {
    console.log('No adapter configured. Using default in-memory adapter.');
  }

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
})`