import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['file', 'folder'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  parentId: {
    type: String,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: true
  }
});

const fileSystemSchema = new mongoose.Schema({
  items: [itemSchema]
}, { 
  timestamps: true 
});

export const FileSystem = mongoose.model('FileSystem', fileSystemSchema);
