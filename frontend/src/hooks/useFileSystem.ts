import { useState, useEffect, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';
import axios from 'axios';
import { config } from '../config';

interface Item {
  id: string;
  type: 'file' | 'folder';
  title: string;
  parentId: string | null;
  isOpen?: boolean;
}

const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const useFileSystem = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Initial data load using REST API - this happens once when the component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await api.get('/api/filesystem');
        setItems(response.data.items);
        setError(null);
      } catch (err) {
        setError('Failed to load initial data');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Socket connection setup
  useEffect(() => {
    const newSocket = io(config.socket.url, config.socket.options);
    setSocket(newSocket);

    // When socket connects successfully
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      setError(null);
    });

    // Handle connection failures
    newSocket.on('connect_error', () => {
      console.log('Socket connection failed');
      setConnected(false);
      setError('Real-time updates unavailable');
    });

    // Handle disconnects
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for updates from other clients
    socket.on('itemsUpdated', (updatedItems: Item[]) => {
      console.log('Received update from other client');
      setItems(updatedItems);
    });

    // Handle any errors from the server
    socket.on('error', (message: string) => {
      setError(message);
    });

    return () => {
      socket.off('itemsUpdated');
      socket.off('error');
    };
  }, [socket]);

  // Update items with real-time sync - now using only Socket.IO
  const updateItems = useCallback((newItems: Item[]) => {
    if (!socket?.connected) {
      setError('Cannot save changes - disconnected from server');
      return;
    }

    // Update local state immediately for responsive UI
    setItems(newItems);
    
    // Emit update through Socket.IO
    socket.emit('updateItems', newItems, (error: string | null) => {
      // This is a callback that runs after the server processes the update
      if (error) {
        setError('Failed to save changes');
        console.error('Error saving changes:', error);
      }
    });
  }, [socket]);

  // Toggle folder with real-time sync
  const toggleFolder = useCallback((folderId: string) => {
    const newItems = items.map(item =>
      item.id === folderId && item.type === 'folder'
        ? { ...item, isOpen: !item.isOpen }
        : item
    );
    updateItems(newItems);
  }, [items, updateItems]);

  return {
    items,
    setItems: updateItems,
    toggleFolder,
    loading,
    error,
    connected
  };
};