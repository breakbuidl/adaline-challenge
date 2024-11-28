import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  File, 
  Folder,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useFileSystem } from './hooks/useFileSystem';

// Base interfaces for our file system
interface Item {
  id: string;
  type: 'file' | 'folder';
  title: string;
  parentId: string | null;
  isOpen?: boolean;
}

interface HighlightInfo {
  folderId: string | null;
  position: 'before' | 'after' | 'inside' | null;
}

// The DraggableItem component handles individual file/folder rendering and drag-drop logic
const DraggableItem = ({
  item,
  items,
  depth = 0,
  onMove,
  onToggleFolder,
  highlightedFolder,
  onHighlightChange,
}: {
  item: Item;
  items: Item[];
  depth?: number;
  onMove: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  onToggleFolder: (folderId: string) => void;
  highlightedFolder: HighlightInfo;
  onHighlightChange: (info: HighlightInfo) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<number>();

  const childItems = items.filter(i => i.parentId === item.id);
  const hasChildren = childItems.length > 0;
  const isFolder = item.type === 'folder';
  const isOpen = item.isOpen ?? true;

  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { 
      id: item.id, 
      parentId: item.parentId,
      type: item.type
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ITEM',
    hover: (draggedItem: any, monitor) => {
      if (!ref.current) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
      
      // Handle folder dropping logic
      if (isFolder) {
        // We create three distinct zones for better drop control
        if (hoverClientY < hoverHeight * 0.3) {
          onHighlightChange({ folderId: item.id, position: 'before' });
        } else if (hoverClientY > hoverHeight * 0.7) {
          onHighlightChange({ folderId: item.id, position: 'after' });
        } else {
          // Middle section is for dropping inside the folder
          onHighlightChange({ folderId: item.id, position: 'inside' });
          
          // Auto-open folder after delay for better UX
          if (!isOpen) {
            clearTimeout(openTimeoutRef.current);
            openTimeoutRef.current = window.setTimeout(() => {
              onToggleFolder(item.id);
            }, 800);
          }
        }
      } else {
        // For files, we only allow before/after drops
        onHighlightChange({ 
          folderId: item.id, 
          position: hoverClientY < hoverHeight / 2 ? 'before' : 'after' 
        });
      }
    },
    canDrop: (draggedItem: any) => {
      if (draggedItem.id === item.id) return false;
      
      // Prevent dropping a folder into its descendants
      if (draggedItem.type === 'folder') {
        let currentParent = item.parentId;
        while (currentParent) {
          if (currentParent === draggedItem.id) return false;
          const parent = items.find(i => i.id === currentParent);
          currentParent = parent?.parentId;
        }
      }
      
      return true;
    },
    drop: (draggedItem: any, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const draggedId = draggedItem.id;
      if (draggedId === item.id) return;

      clearTimeout(openTimeoutRef.current);

      // Handle the drop based on the current highlight state
      const currentHighlight = highlightedFolder;
      
      // Special handling for folder drops
      if (isFolder && currentHighlight.folderId === item.id && currentHighlight.position === 'inside') {
        onMove(draggedId, item.id, 'inside');
      } else {
        // Handle before/after positions
        onMove(draggedId, item.id, currentHighlight.position || 'after');
      }

      // Clean up the highlight state
      onHighlightChange({ folderId: null, position: null });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  useEffect(() => {
    return () => clearTimeout(openTimeoutRef.current);
  }, []);

  const dragDropRef = (node: HTMLDivElement | null) => {
    drag(drop(node));
    ref.current = node;
  };

  return (
    <div className="relative">
      {isOver && highlightedFolder.position === 'before' && canDrop && (
        <div 
          className="absolute left-0 right-4 h-0.5 -translate-y-px bg-blue-500"
          style={{ marginLeft: `${depth * 20}px` }} 
        />
      )}

      <div 
        className={`
          relative
          ${highlightedFolder.folderId === item.id && 
            highlightedFolder.position === 'inside' ? 'bg-blue-50 rounded-lg' : ''}
        `}
      >
        <div
          ref={dragDropRef}
          style={{ paddingLeft: `${depth * 20}px` }}
          className={`
            relative flex items-center gap-2 py-1 px-4
            ${isDragging ? 'opacity-50' : ''}
            transition-colors duration-150
            rounded-lg
          `}
        >
          {isFolder && (
            <button
              onClick={() => onToggleFolder(item.id)}
              className="absolute left-[4px] flex items-center justify-center w-4 h-4
                text-gray-400 hover:bg-gray-100 rounded"
              style={{ left: `${depth * 20 + 4}px` }}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}

          <div className="flex items-center gap-2 p-1.5 rounded-md flex-1 hover:bg-gray-50 cursor-move">
            {isFolder ? (
              <Folder size={16} className="text-blue-400" />
            ) : (
              <File size={16} className="text-gray-400" />
            )}
            <span className="truncate text-sm text-gray-700">{item.title}</span>
          </div>
        </div>

        {isFolder && isOpen && hasChildren && (
          <div>
            {childItems.map(childItem => (
              <DraggableItem
                key={childItem.id}
                item={childItem}
                items={items}
                depth={depth + 1}
                onMove={onMove}
                onToggleFolder={onToggleFolder}
                highlightedFolder={highlightedFolder}
                onHighlightChange={onHighlightChange}
              />
            ))}
          </div>
        )}
      </div>

      {isOver && highlightedFolder.position === 'after' && canDrop && (
        <div 
          className="absolute left-0 right-4 h-0.5 translate-y-px bg-blue-500"
          style={{ marginLeft: `${depth * 20}px` }} 
        />
      )}
    </div>
  );
};

const App = () => {
  const { items, setItems, toggleFolder, loading, error } = useFileSystem();

  // Add debug logging
  console.log('FileSystem State:', {
    items,
    loading,
    error,
    itemsLength: items?.length
  });

  const [newItemName, setNewItemName] = useState('');
  const [highlightedFolder, setHighlightedFolder] = useState<HighlightInfo>({
    folderId: null,
    position: null
  });

  const handleMove = (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    const workingItems = [...items];
    const draggedIndex = workingItems.findIndex(item => item.id === draggedId);
    
    if (draggedIndex === -1) {
      console.log('Dragged item not found:', draggedId);
      return;
    }

    const draggedItem = workingItems[draggedIndex];
    
    // Get descendants while preserving their folder states
    const getAllDescendants = (parentId: string): Item[] => {
      return workingItems.filter(item => {
        if (item.parentId === parentId) {
          if (item.type === 'folder') {
            // Make sure we keep the isOpen state for nested folders
            return [...getAllDescendants(item.id), {
              ...item,
              isOpen: item.isOpen !== undefined ? item.isOpen : true
            }];
          }
          return true;
        }
        return false;
      });
    };

    const itemsToMove = draggedItem.type === 'folder'
      ? [{ ...draggedItem }, ...getAllDescendants(draggedItem.id)]
      : [{ ...draggedItem }];

    // Remove items from their current position
    const itemIdsToMove = new Set(itemsToMove.map(item => item.id));
    const remainingItems = workingItems.filter(item => !itemIdsToMove.has(item.id));

    // Update parent IDs while preserving folder states
    const updatedItemsToMove = itemsToMove.map(item => {
      if (item.id === draggedId) {
        return {
          ...item,
          parentId: position === 'inside' ? targetId :
            targetId ? remainingItems.find(i => i.id === targetId)?.parentId ?? null : null,
          // Preserve the isOpen state for folders
          ...(item.type === 'folder' ? { isOpen: item.isOpen } : {})
        };
      }
      // Keep other items unchanged, including their folder states
      return item;
    });

    let insertIndex = remainingItems.length;
    if (targetId) {
      const targetIndex = remainingItems.findIndex(item => item.id === targetId);
      if (targetIndex !== -1) {
        insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
      }
    }

    // Combine everything into the final array
    const finalItems = [
      ...remainingItems.slice(0, insertIndex),
      ...updatedItemsToMove,
      ...remainingItems.slice(insertIndex)
    ];

    // Update state with the new array
    setItems(finalItems);
  };

  const createNewItem = (type: 'file' | 'folder') => {
    if (!newItemName.trim()) return;

    // Create the new item with the correct structure
    const newItem = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      title: newItemName.trim(),
      parentId: null,
      isOpen: type === 'folder' ? true : undefined
    };

    // Create a new array with all existing items plus the new one
    const updatedItems = Array.isArray(items) ? [...items, newItem] : [newItem];
    
    // Log the update for debugging
    console.log('Creating new item:', {
      newItem,
      existingItemsCount: items.length,
      updatedItemsCount: updatedItems.length
    });

    // Update the items through the FileSystem hook
    setItems(updatedItems);

    // Clear the input field
    setNewItemName('');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!items) {
    return <div className="p-4">No items available. FileSystem not initialized.</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-center mb-8">
            File System
          </h1>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4">
              <div className="flex flex-col gap-2 mb-4">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter item title"
                  className="w-full px-4 py-2 bg-transparent border border-gray-200 
                    rounded-lg text-gray-700 placeholder-gray-400
                    focus:outline-none focus:border-gray-300"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => createNewItem('file')}
                    disabled={!newItemName.trim()}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg 
                      hover:bg-gray-300 disabled:opacity-50"
                  >
                    Add File
                  </button>
                  <button
                    onClick={() => createNewItem('folder')}
                    disabled={!newItemName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg 
                      hover:bg-blue-200 disabled:opacity-50"
                  >
                    New Folder
                  </button>
                </div>
              </div>

              <div className="mt-2">
                {(!items || items.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    No items yet. Create your first file or folder above.
                  </div>
                ) : (
                  items
                    .filter(item => item.parentId === null)
                    .map(item => (
                      <DraggableItem
                        key={item.id}
                        item={item}
                        items={items}
                        onMove={handleMove}
                        onToggleFolder={toggleFolder}
                        highlightedFolder={highlightedFolder}
                        onHighlightChange={setHighlightedFolder}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;