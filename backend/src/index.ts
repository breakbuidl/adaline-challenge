// backend/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { FileSystem } from './models/FileSystem';

const app = express();
const httpServer = createServer(app);

// Create Socket.IO server with CORS settings for development
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/filesystem');

// Track connected clients for debugging
let connectedClients = 0;

// Handle socket connections
io.on('connection', async (socket) => {
  connectedClients++;
  console.log(`Client connected. Total clients: ${connectedClients}`);

  // Send initial data when client connects
  const fileSystem = await FileSystem.findOne();
  socket.emit('initialData', fileSystem?.items || []);

  // Handle item updates from clients
  socket.on('updateItems', async (items) => {
    try {
      // Save to database
      await FileSystem.findOneAndUpdate(
        {}, // Empty filter to match any document
        { items },
        { upsert: true } // Create if doesn't exist
      );

      // Broadcast to all other clients
      socket.broadcast.emit('itemsUpdated', items);
    } catch (error) {
      console.error('Error saving items:', error);
      socket.emit('error', 'Failed to save changes');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`Client disconnected. Total clients: ${connectedClients}`);
  });
});

// Keep the REST endpoint for initial page load
app.get('/api/filesystem', async (req, res) => {
  try {
    const fileSystem = await FileSystem.findOne();
    res.json(fileSystem || { items: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file system' });
  }
});

httpServer.listen(3001, () => {
  console.log('Server running on port 3001');
});