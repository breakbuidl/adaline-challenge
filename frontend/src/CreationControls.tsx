// CreationControls.tsx
import React, { useState } from 'react';
import { File, Folder } from 'lucide-react';

const CreationControls = ({ 
  onCreateFile, 
  onCreateFolder 
}: {
  onCreateFile: (name: string) => void;
  onCreateFolder: (name: string) => void;
}) => {
  const [activeType, setActiveType] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const handleCreate = () => {
    if (!newItemName.trim() || !activeType) return;
    
    if (activeType === 'file') {
      onCreateFile(newItemName.trim());
    } else {
      onCreateFolder(newItemName.trim());
    }
    
    setNewItemName('');
    setActiveType(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newItemName.trim()) {
      handleCreate();
    } else if (e.key === 'Escape') {
      setActiveType(null);
      setNewItemName('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {!activeType ? (
        // Type Selection Buttons
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setActiveType('file')}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl
              border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50
              transition-all duration-200 group"
          >
            <File className="text-gray-400 group-hover:text-gray-600" size={20} />
            <span className="font-medium text-gray-600">New File</span>
          </button>
          
          <button
            onClick={() => setActiveType('folder')}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl
              border-2 border-blue-100 hover:border-blue-200 hover:bg-blue-50
              transition-all duration-200 group"
          >
            <Folder className="text-blue-400 group-hover:text-blue-600" size={20} />
            <span className="font-medium text-blue-600">New Folder</span>
          </button>
        </div>
      ) : (
        // Name Input Field
        <div className="relative">
          <div
            className={`
              flex items-center gap-3 p-2 pl-4 bg-white rounded-xl
              shadow-sm border-2 transition-all duration-200
              ${activeType === 'folder' 
                ? 'border-blue-200 focus-within:border-blue-300' 
                : 'border-gray-200 focus-within:border-gray-300'
              }
            `}
          >
            {/* Icon */}
            {activeType === 'folder' ? (
              <Folder className="text-blue-400" size={20} />
            ) : (
              <File className="text-gray-400" size={20} />
            )}
            
            {/* Input Field */}
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${activeType} name...`}
              autoFocus
              className={`
                flex-1 text-sm border-0 focus:ring-0 bg-transparent
                placeholder:text-gray-400
              `}
            />
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveType(null);
                  setNewItemName('');
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700
                  hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleCreate}
                disabled={!newItemName.trim()}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg
                  transition-colors disabled:opacity-50
                  ${activeType === 'folder'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                  }
                `}
              >
                Create {activeType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreationControls;