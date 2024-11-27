// frontend/src/hooks/useFileSystem.ts
import { useState, useEffect, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';
import axios from 'axios';

interface Item {
  id: string;
  type: 'file' | 'folder';
  title: string;
  parentId: string | null;
  isOpen?: boolean;
}

export const useFileSystem = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Socket connection handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', () => {
      setError('Connection to server failed');
      setConnected(false);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Set up data handlers
  useEffect(() => {
    if (!socket) return;

    // Handle initial data load
    socket.on('initialData', (data: Item[]) => {
      setItems(data);
      setLoading(false);
    });

    // Handle updates from other clients
    socket.on('itemsUpdated', (updatedItems: Item[]) => {
      setItems(updatedItems);
    });

    // Handle errors
    socket.on('error', (message: string) => {
      setError(message);
    });

    return () => {
      socket.off('initialData');
      socket.off('itemsUpdated');
      socket.off('error');
    };
  }, [socket]);

  // Update items with real-time sync
  const updateItems = useCallback((newItems: Item[]) => {
    setItems(newItems);
    // Only emit if we're connected
    if (socket?.connected) {
      socket.emit('updateItems', newItems);
    } else {
      setError('Changes not saved - disconnected from server');
    }
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