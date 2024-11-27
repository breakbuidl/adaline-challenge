import { useState, useEffect } from 'react';
import axios from 'axios';

interface Item {
  id: string;
  type: 'file' | 'folder';
  title: string;
  parentId: string | null;
  isOpen?: boolean;
}

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const useFileSystem = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadFileSystem = async () => {
      try {
        const response = await api.get('/filesystem');
        setItems(response.data.items);
        setError(null);
      } catch (err) {
        setError('Failed to load file system');
      } finally {
        setLoading(false);
      }
    };

    loadFileSystem();
  }, []);

  // Update items with server sync
  const updateItems = async (newItems: Item[]) => {
    try {
      await api.put('/filesystem', { items: newItems });
      setItems(newItems);
      setError(null);
    } catch (err) {
      setError('Failed to save changes');
    }
  };

  // Toggle folder
  const toggleFolder = (folderId: string) => {
    const newItems = items.map(item =>
      item.id === folderId && item.type === 'folder'
        ? { ...item, isOpen: !item.isOpen }
        : item
    );
    updateItems(newItems);
  };

  return {
    items,
    setItems: updateItems,
    toggleFolder,
    loading,
    error
  };
};
