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

  // Initialize Socket.IO with adapter if configured
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })
  
  // Set up adapter if configured
  const adapterConfig = await loadAdapterConfig();
  if (adapterConfig) {
    try {
      console.log(\`Setting up \${adapterConfig.type} adapter...\`);
      
      if (adapterConfig.type === 'redis') {
        const { createAdapter } = await import('@socket.io/redis-adapter');
        const { createClient } = await import('redis');
        
        const pubClient = createClient(adapterConfig.options || {});
        const subClient = pubClient.duplicate();
        
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        
        console.log('Redis adapter set up successfully');
      } 
      else if (adapterConfig.type === 'mongo' || adapterConfig.type === 'mongodb') {
        const { createAdapter } = await import('@socket.io/mongo-adapter');
        const { MongoClient } = await import('mongodb');
        
        const mongoClient = new MongoClient(adapterConfig.uri);
        await mongoClient.connect();
        
        const mongoCollection = mongoClient
          .db(adapterConfig.dbName || 'socketio')
          .collection(adapterConfig.collection || 'socket.io-adapter-events');
        
        io.adapter(createAdapter(mongoCollection));
        console.log('MongoDB adapter set up successfully');
      }
      else if (adapterConfig.type === 'custom' && adapterConfig.setupFunction) {
        // For custom adapters, users can provide a setupFunction path
        const setupModule = await import(adapterConfig.setupFunction);
        await setupModule.default(io, adapterConfig);
        console.log('Custom adapter set up successfully');
      }
    } catch (error) {
      console.error('Failed to set up adapter:', error);
      console.warn('Falling back to in-memory adapter');
    }
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