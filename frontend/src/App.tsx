import { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  File, 
  Folder,
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderPlus,
} from 'lucide-react';
import { useFileSystem } from './hooks/useFileSystem';

// Types
interface Item {
  id: string;
  type: 'file' | 'folder';
  title: string;
  parentId: string | null;
  isOpen?: boolean;
}

// DraggableItem Component
const DraggableItem = ({
  item,
  items,
  depth = 0,
  onMove,
  onToggleFolder,
}: {
  item: Item;
  items: Item[];
  depth?: number;
  onMove: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  onToggleFolder: (folderId: string) => void;
}) => {
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const childItems = items.filter(i => i.parentId === item.id);
  const hasChildren = childItems.length > 0;
  const isFolder = item.type === 'folder';
  const isOpen = item.isOpen ?? true;

  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { id: item.id, parentId: item.parentId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<{ id: string; parentId: string | null }>({
    accept: 'ITEM',
    hover: (_draggedItem: any, monitor) => {
      if (!ref.current) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
      
      if (isFolder) {
        if (hoverClientY < hoverHeight * 0.25) {
          setDropPosition('before');
        } else if (hoverClientY > hoverHeight * 0.75) {
          setDropPosition('after');
        } else {
          setDropPosition('inside');
          if (!isOpen) onToggleFolder(item.id);
        }
      } else {
        setDropPosition(hoverClientY < hoverHeight / 2 ? 'before' : 'after');
      }
    },
    drop: (draggedItem: any, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const draggedId = draggedItem.id;
      if (draggedId === item.id) return;

      if (dropPosition) {
        onMove(draggedId, item.id, dropPosition);
      }
      setDropPosition(null);
    },
  });

  const dragDropRef = (node: HTMLDivElement | null) => {
    drag(drop(node));
    ref.current = node;
  };

  return (
    <div className="relative">
      {isOver && dropPosition === 'before' && (
        <div 
          className="h-0.5 -mt-0.5 mx-2 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 28 + 8}px` }} 
        />
      )}

      <div
        ref={dragDropRef}
        style={{ paddingLeft: `${depth * 28}px` }}
        className={`
          group relative flex items-center gap-2 px-4 py-2.5
          ${isDragging ? 'opacity-50' : ''}
          ${isOver && dropPosition === 'inside' ? 'bg-blue-50' : 'hover:bg-gray-50'}
          cursor-move transition-all duration-150
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolder(item.id);
              }}
              className={`
                p-1 rounded hover:bg-gray-100
                ${hasChildren ? 'text-gray-400' : 'text-gray-300'}
              `}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}

          {isFolder ? (
            <Folder 
              size={18} 
              className={isOver && dropPosition === 'inside' ? 'text-blue-500' : 'text-gray-400'} 
            />
          ) : (
            <File size={18} className="text-gray-400" />
          )}

          <span className="truncate text-sm text-gray-700">{item.title}</span>
        </div>

        {isOver && dropPosition === 'inside' && isFolder && (
          <div className="absolute inset-0 ring-2 ring-blue-500 rounded-lg pointer-events-none" />
        )}
      </div>

      {isOver && dropPosition === 'after' && (
        <div 
          className="h-0.5 -mb-0.5 mx-2 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 28 + 8}px` }} 
        />
      )}

      {isFolder && isOpen && hasChildren && (
        <div className="relative">
          <div 
            className="absolute left-[36px] top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${depth * 28 + 36}px` }}
          />
          {childItems.map(childItem => (
            <DraggableItem
              key={childItem.id}
              item={childItem}
              items={items}
              depth={depth + 1}
              onMove={onMove}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const { 
    items, 
    setItems, 
    toggleFolder,
    loading,
    error 
  } = useFileSystem();
  const [newItemName, setNewItemName] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading your files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const handleCreateFile = () => {
    if (!newItemName.trim()) return;
    
    setItems([...items, {
      id: Math.random().toString(36).slice(2),
      type: 'file',
      title: newItemName.trim(),
      parentId: null
    }]);
    setNewItemName('');
  };

  const handleCreateFolder = () => {
    if (!newItemName.trim()) return;
    
    setItems([...items, {
      id: Math.random().toString(36).slice(2),
      type: 'folder',
      title: newItemName.trim(),
      parentId: null,
      isOpen: true
    }]);
    setNewItemName('');
  };

  const handleMove = (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    const newItems = [...items];
    const draggedItem = newItems.find(item => item.id === draggedId);
    if (!draggedItem) return;

    // Prevent dropping a folder into its own descendant
    if (position === 'inside' && draggedItem.type === 'folder') {
      let currentParent = targetId;
      while (currentParent) {
        if (currentParent === draggedId) return;
        const parent = newItems.find(item => item.id === currentParent);
        currentParent = parent?.parentId || null;
      }
    }

    // Remove the dragged item from its current position
    const draggedIndex = newItems.findIndex(item => item.id === draggedId);
    newItems.splice(draggedIndex, 1);

    // If there's no target, append to the end
    if (!targetId) {
      newItems.push({ ...draggedItem, parentId: null });
      setItems(newItems);
      return;
    }

    // Find the target index
    const targetIndex = newItems.findIndex(item => item.id === targetId);

    // Insert the item at the new position
    if (position === 'inside') {
      newItems.push({ ...draggedItem, parentId: targetId });
    } else {
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      newItems.splice(insertIndex, 0, { ...draggedItem, parentId: null });
    }

    setItems(newItems);
  };

  const rootItems = items.filter(item => item.parentId === null);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Files & Folders
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Enter name..."
                className="flex-1 px-3 py-2 border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreateFile}
                disabled={!newItemName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white 
                  rounded-lg hover:bg-gray-900 disabled:opacity-50"
              >
                <FilePlus size={18} />
                Add File
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newItemName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                  rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <FolderPlus size={18} />
                Add Folder
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              {rootItems.length > 0 ? (
                rootItems.map(item => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    items={items}
                    onMove={handleMove}
                    onToggleFolder={toggleFolder}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No items yet. Create your first file or folder.
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {items.filter(i => i.type === 'file').length} files, {' '}
              {items.filter(i => i.type === 'folder').length} folders
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default App;