import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Menu, 
  Search, 
  ArrowLeft, 
  MoreVertical, 
  Check, 
  Square,
  Share2,
  Trash2,
  CheckSquare
} from 'lucide-react';

import { Checklist, ChecklistItem } from './types';
import * as Storage from './services/storage';
import ChecklistCard from './components/ChecklistCard';
import CreateDialog from './components/CreateDialog';

// Simple colors suitable for checklist avatars/headers
const COLORS = [
  'bg-red-200', 'bg-orange-200', 'bg-amber-200', 
  'bg-green-200', 'bg-emerald-200', 'bg-teal-200', 
  'bg-cyan-200', 'bg-sky-200', 'bg-blue-200', 
  'bg-indigo-200', 'bg-violet-200', 'bg-purple-200', 
  'bg-fuchsia-200', 'bg-pink-200', 'bg-rose-200'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

function App() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loaded = Storage.getChecklists();
    setChecklists(loaded);
  }, []);

  // Save data on change
  useEffect(() => {
    Storage.saveChecklists(checklists);
  }, [checklists]);

  const activeChecklist = checklists.find(c => c.id === activeChecklistId);

  const handleCreateChecklist = (title: string, generatedItems?: string[]) => {
    const newChecklist: Checklist = {
      id: uuidv4(),
      title,
      items: generatedItems 
        ? generatedItems.map(text => ({ id: uuidv4(), text, isCompleted: false }))
        : [],
      color: getRandomColor(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChecklists(prev => [newChecklist, ...prev]);
    setActiveChecklistId(newChecklist.id);
  };

  const handleDeleteChecklist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this checklist?")) {
      setChecklists(prev => prev.filter(c => c.id !== id));
      if (activeChecklistId === id) setActiveChecklistId(null);
    }
  };

  const toggleItem = (checklistId: string, itemId: string) => {
    setChecklists(prev => prev.map(list => {
      if (list.id !== checklistId) return list;
      return {
        ...list,
        items: list.items.map(item => 
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        ),
        updatedAt: Date.now()
      };
    }));
  };

  const addItem = (checklistId: string, text: string) => {
    if (!text.trim()) return;
    setChecklists(prev => prev.map(list => {
      if (list.id !== checklistId) return list;
      return {
        ...list,
        items: [...list.items, { id: uuidv4(), text, isCompleted: false }],
        updatedAt: Date.now()
      };
    }));
  };

  const deleteItem = (checklistId: string, itemId: string) => {
    setChecklists(prev => prev.map(list => {
      if (list.id !== checklistId) return list;
      return {
        ...list,
        items: list.items.filter(item => item.id !== itemId),
        updatedAt: Date.now()
      };
    }));
  };

  // Filter checklists for home screen
  const filteredChecklists = checklists.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Views ---

  // 1. Home View
  const renderHome = () => (
    <div className="min-h-screen pb-24 animate-in fade-in duration-300">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 bg-md-background/95 backdrop-blur-md pt-2 px-4 pb-2">
        <div className="flex items-center h-16 bg-md-surfaceVariant/50 rounded-full px-4 mb-2">
          <Menu className="text-md-onSurface cursor-pointer" onClick={() => alert("Menu: Settings & About coming soon!")} />
          <input 
            type="text" 
            placeholder="Search your checklists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none px-4 text-md-onSurface placeholder-md-onSurface/50 text-base"
          />
          {searchQuery ? (
             <button onClick={() => setSearchQuery('')} className="p-1"><Trash2 size={16} /></button>
          ) : (
             <Search className="text-md-onSurface/50" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <h1 className="text-3xl font-normal text-md-onSurface mb-6 px-2">My Checklists</h1>
        
        {filteredChecklists.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-md-onSurface/40">
            <CheckSquare size={64} className="mb-4 opacity-50" />
            <p className="text-lg">No checklists found</p>
            <p className="text-sm">Create one to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChecklists.map(checklist => (
              <ChecklistCard 
                key={checklist.id} 
                checklist={checklist} 
                onClick={() => setActiveChecklistId(checklist.id)}
                onDelete={(e) => handleDeleteChecklist(e, checklist.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => setShowCreateDialog(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-md-primaryContainer text-md-onPrimaryContainer rounded-[16px] shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );

  // 2. Detail View
  const renderDetail = () => {
    if (!activeChecklist) return null;

    const completedItems = activeChecklist.items.filter(i => i.isCompleted);
    const incompleteItems = activeChecklist.items.filter(i => !i.isCompleted);

    return (
      <div className="min-h-screen bg-md-background animate-in slide-in-from-right-10 duration-300">
        {/* Detail Top Bar */}
        <div className="sticky top-0 z-10 bg-md-background/95 backdrop-blur-md px-2 h-16 flex items-center justify-between border-b border-md-outline/10">
          <div className="flex items-center flex-1 overflow-hidden">
            <button 
              onClick={() => setActiveChecklistId(null)}
              className="p-3 rounded-full hover:bg-md-onSurface/10 text-md-onSurface transition-colors mr-1"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-normal text-md-onSurface truncate pr-4">
              {activeChecklist.title}
            </h1>
          </div>
          <div className="flex items-center">
            <button className="p-3 rounded-full hover:bg-md-onSurface/10 text-md-onSurface transition-colors">
              <Share2 size={20} />
            </button>
            <button 
              className="p-3 rounded-full hover:bg-md-onSurface/10 text-md-onSurface transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 max-w-3xl mx-auto pb-24">
          
          {/* Add Item Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('newItem') as HTMLInputElement);
              addItem(activeChecklist.id, input.value);
              input.value = '';
            }}
            className="mb-6 relative"
          >
            <input 
              type="text" 
              name="newItem"
              placeholder="+ Add new item"
              className="w-full bg-transparent border-none outline-none text-lg py-3 px-2 text-md-onSurface placeholder-md-onSurface/40 border-b border-md-outline/20 focus:border-md-primary transition-colors"
              autoComplete="off"
            />
          </form>

          {/* Incomplete Items */}
          <div className="space-y-1 mb-8">
            {incompleteItems.map(item => (
              <div 
                key={item.id} 
                className="group flex items-center p-3 rounded-xl hover:bg-md-surfaceVariant/30 transition-colors cursor-pointer"
                onClick={() => toggleItem(activeChecklist.id, item.id)}
              >
                <div className={`w-6 h-6 rounded border-2 mr-4 flex items-center justify-center transition-colors ${item.isCompleted ? 'bg-md-primary border-md-primary' : 'border-md-onSurface/40'}`}>
                  {item.isCompleted && <Check size={16} className="text-md-onPrimary" />}
                </div>
                <span className="flex-1 text-lg text-md-onSurface">{item.text}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteItem(activeChecklist.id, item.id); }}
                  className="p-2 opacity-0 group-hover:opacity-100 text-md-onSurface/40 hover:text-md-error transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Completed Items Section */}
          {completedItems.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-md-onSurface/50 uppercase tracking-widest mb-2 px-2">
                Completed ({completedItems.length})
              </h3>
              <div className="space-y-1">
                {completedItems.map(item => (
                   <div 
                   key={item.id} 
                   className="group flex items-center p-3 rounded-xl hover:bg-md-surfaceVariant/30 transition-colors cursor-pointer opacity-60"
                   onClick={() => toggleItem(activeChecklist.id, item.id)}
                 >
                   <div className="w-6 h-6 rounded border-2 border-md-primary bg-md-primary mr-4 flex items-center justify-center">
                     <Check size={16} className="text-md-onPrimary" />
                   </div>
                   <span className="flex-1 text-lg text-md-onSurface line-through decoration-md-onSurface/30">{item.text}</span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); deleteItem(activeChecklist.id, item.id); }}
                     className="p-2 opacity-0 group-hover:opacity-100 text-md-onSurface/40 hover:text-md-error transition-all"
                   >
                     <Trash2 size={18} />
                   </button>
                 </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {activeChecklistId ? renderDetail() : renderHome()}
      {showCreateDialog && (
        <CreateDialog 
          onClose={() => setShowCreateDialog(false)} 
          onCreate={handleCreateChecklist}
        />
      )}
    </>
  );
}

export default App;
