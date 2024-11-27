import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';

// Core types
interface Item {
  id: string;
  type: 'item' | 'folder';
  title: string;
  icon: string;
  parentId: string | null;
}

interface DragItem {
  id: string;
  type: 'DRAG_ITEM';
  originalIndex: number;
  parentId: string | null;
}

// Visual indicator for drop target
const InsertionIndicator = ({ isActive, depth = 0 }: { isActive: boolean; depth?: number }) => (
  <div
    style={{ marginLeft: `${depth * 24}px` }}
    className={`h-0.5 rounded-full my-0.5 transition-all duration-200 ease-in-out ${
      isActive ? 'bg-blue-500' : 'bg-transparent'
    }`}
  />
);

// Main draggable item component
const DraggableItem = ({ 
  item, 
  items,
  level = 0,
  onMove,
  onToggleFolder,
  isDraggingAny
}: { 
  item: Item;
  items: Item[];
  level?: number;
  onMove: (itemId: string, toParentId: string | null, targetIndex: number) => void;
  onToggleFolder: (folderId: string) => void;
  isDraggingAny: boolean;
}) => {
  const [isOver, setIsOver] = useState(false);
  const [isOverTop, setIsOverTop] = useState(false);
  const [isOverBottom, setIsOverBottom] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(true);
  
  const isFolder = item.type === 'folder';
  const childItems = items.filter(i => i.parentId === item.id);
  const currentLevelItems = items.filter(i => i.parentId === item.parentId);
  const originalIndex = currentLevelItems.findIndex(i => i.id === item.id);
  
  const ref = useRef<HTMLDivElement>(null);

  // Drag configuration
  const [{ isDragging }, drag] = useDrag({
    type: 'DRAG_ITEM',
    item: { 
      id: item.id, 
      type: 'DRAG_ITEM',
      originalIndex,
      parentId: item.parentId 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop configuration
  const [{ isOverCurrent }, drop] = useDrop({
    accept: 'DRAG_ITEM',
    hover: (dragItem: DragItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !ref.current) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Update visual feedback based on hover position
      setIsOverTop(hoverClientY < hoverMiddleY * 0.5);
      setIsOverBottom(hoverClientY > hoverMiddleY * 1.5);
      setIsOver(hoverClientY >= hoverMiddleY * 0.5 && hoverClientY <= hoverMiddleY * 1.5);
    },
    drop: (dragItem: DragItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (monitor.didDrop()) return;
      if (dragItem.id === item.id) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !ref.current) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (isFolder && hoverClientY >= hoverMiddleY * 0.5 && hoverClientY <= hoverMiddleY * 1.5) {
        // Drop into folder
        onMove(dragItem.id, item.id, 0);
      } else {
        // Drop before or after
        const targetIndex = currentLevelItems.findIndex(i => i.id === item.id);
        onMove(
          dragItem.id, 
          item.parentId, 
          hoverClientY < hoverMiddleY ? targetIndex : targetIndex + 1
        );
      }
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  });

  // Combine drag and drop refs
  const dragDropRef = (node: HTMLDivElement | null) => {
    drag(drop(node));
    ref.current = node;
  };

  const handleToggleFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setIsFolderOpen(!isFolderOpen);
      onToggleFolder(item.id);
    }
  };

  return (
    <>
      <InsertionIndicator isActive={isOverTop} depth={level} />
      
      <div
        ref={dragDropRef}
        style={{ marginLeft: `${level * 24}px` }}
        className={`
          group flex items-center gap-2 p-2.5 rounded-lg
          ${isDragging ? 'opacity-50' : ''}
          ${isOverCurrent && isOver && isFolder ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-white'}
          ${!isDragging && !isDraggingAny ? 'hover:bg-gray-50' : ''}
          border border-gray-200 shadow-sm
          cursor-move transition-colors duration-200
        `}
      >
        {isFolder && (
          <button 
            onClick={handleToggleFolder}
            className="p-1 rounded hover:bg-gray-100 text-gray-400"
          >
            {isFolderOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        )}
        
        {isFolder ? (
          <Folder 
            className={`${isOverCurrent && isOver ? 'text-blue-500' : 'text-gray-400'}`} 
            size={20} 
          />
        ) : (
          <File size={20} className="text-gray-400" />
        )}
        
        <span className="text-sm text-gray-700 font-medium select-none">
          {item.title}
        </span>
      </div>
      
      <InsertionIndicator isActive={isOverBottom} depth={level} />
      
      {isFolder && isFolderOpen && childItems.length > 0 && (
        <div className={`
          ml-6 pl-4 border-l border-gray-200
          ${isDraggingAny ? 'transition-all duration-200' : ''}
        `}>
          {childItems.map((childItem) => (
            <DraggableItem
              key={childItem.id}
              item={childItem}
              items={items}
              level={level + 1}
              onMove={onMove}
              onToggleFolder={onToggleFolder}
              isDraggingAny={isDraggingAny}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default DraggableItem;