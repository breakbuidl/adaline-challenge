import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { FileSystem } from './models/FileSystem';

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/filesystem');

// Get file system
app.get('/api/filesystem', async (req, res) => {
  try {
    let fileSystem = await FileSystem.findOne();
    if (!fileSystem) {
      fileSystem = await FileSystem.create({ items: [] });
    }
    res.json(fileSystem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file system' });
  }
});

// Update file system
app.put('/api/filesystem', async (req, res) => {
    console.log('put called');
  try {
    const { items } = req.body;
    let fileSystem = await FileSystem.findOne();
    
    if (!fileSystem) {
      fileSystem = await FileSystem.create({ items });
    } else {
      fileSystem.items = items;
      await fileSystem.save();
    }
    
    res.json(fileSystem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update file system' });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
