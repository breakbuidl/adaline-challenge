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
  // We'll track both the overall loading state and specific operation states
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // This effect handles the initial data load from the REST API
  useEffect(() => {
    // We define an async function to load the initial data
    const loadInitialData = async () => {
      console.log('Starting initial data load...');
      
      try {
        // Make the API request
        const response = await api.get('/api/filesystem');
        console.log('API response received:', response.data);

        // Validate the response data
        if (!response.data || !response.data.items) {
          throw new Error('Invalid response format - missing items array');
        }

        // Update the items state with the received data
        setItems(response.data.items);
        console.log('Items state updated with', response.data.items.length, 'items');
        
        // Clear any existing errors
        setError(null);
        
      } catch (err) {
        // Handle any errors that occurred during the load
        console.error('Error during initial data load:', err);
        setError('Failed to load initial data: ' + (err.message || 'Unknown error'));
        
        // Even if we have an error, we still want to consider the initial load complete
        setItems([]);
        
      } finally {
        // Always mark loading as complete and initial load as done
        console.log('Finishing initial data load...');
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    // Only attempt to load data if we haven't completed the initial load
    if (!initialLoadComplete) {
      loadInitialData();
    }
  }, [initialLoadComplete]); // We depend on initialLoadComplete to prevent unnecessary reloads

  // Socket connection setup effect
  useEffect(() => {
    console.log('Setting up socket connection...');
    
    const newSocket = io(config.socket.url, {
      ...config.socket.options,
      // Add reasonable timeouts and reconnection settings
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3
    });

    // Socket connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnected(false);
      // Don't block the UI for socket connection issues
      setError('Real-time updates unavailable');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      console.log('Cleaning up socket connection...');
      newSocket.close();
    };
  }, []);

  // Real-time updates handler
  useEffect(() => {
    if (!socket) return;

    socket.on('itemsUpdated', (updatedItems: Item[]) => {
      console.log('Received update from server:', updatedItems);
      
      // Ensure we preserve the isOpen state when receiving updates
      const newItems = updatedItems.map(updatedItem => {
        // Find the corresponding item in our current state
        const existingItem = items.find(item => item.id === updatedItem.id);
        
        if (existingItem && existingItem.type === 'folder') {
          // Preserve the isOpen state from the update
          return {
            ...updatedItem,
            isOpen: updatedItem.isOpen !== undefined ? updatedItem.isOpen : existingItem.isOpen
          };
        }
        
        return updatedItem;
      });

      setItems(newItems);
    });

    return () => {
      socket.off('itemsUpdated');
      socket.off('error');
    };
  }, [socket, items]);

  // Update items function
  const updateItems = useCallback((newItems: Item[]) => {
    if (!Array.isArray(newItems)) {
      console.error('Invalid items format provided to updateItems');
      return;
    }

    if (!socket?.connected) {
      console.error('Cannot save changes - disconnected from server');
      setError('Cannot save changes - disconnected from server');
      return;
    }

    // Ensure all folder items have an isOpen property
    const itemsWithFolderState = newItems.map(item => {
      if (item.type === 'folder') {
        return {
          ...item,
          isOpen: item.isOpen !== undefined ? item.isOpen : true // Default to true if not set
        };
      }
      return item;
    });

    console.log('Updating items with folder states:', itemsWithFolderState);
    
    // Update local state immediately for responsive UI
    setItems(itemsWithFolderState);
    
    // Emit update through Socket.IO
    socket.emit('updateItems', itemsWithFolderState, (error: string | null) => {
      if (error) {
        console.error('Failed to save changes:', error);
        setError('Failed to save changes');
      }
    });
  }, [socket]);

  // Update toggleFolder to use setItems directly instead of modifying state separately
  const toggleFolder = useCallback((folderId: string) => {
    // Create a new array with the updated folder state
    const updatedItems = items.map(item =>
      item.id === folderId && item.type === 'folder'
        ? { ...item, isOpen: !item.isOpen }
        : item
    );

    // Use setItems to update the state, which will trigger synchronization
    setItems(updatedItems);
  }, [items, setItems]);

  // Return the hook's interface
  return {
    items: Array.isArray(items) ? items : [],
    setItems: updateItems,
    toggleFolder,
    loading,
    error,
    connected
  };
};