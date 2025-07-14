import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StashItem } from '@shared/schema';

const STASH_STORAGE_KEY = 'namejam-stash';

interface StashContextType {
  stash: StashItem[];
  addToStash: (item: Omit<StashItem, 'id' | 'savedAt'>) => boolean;
  removeFromStash: (id: string) => void;
  clearStash: () => void;
  isInStash: (name: string, type: 'band' | 'song' | 'setlist' | 'bandLore') => boolean;
  stashCount: number;
}

const StashContext = createContext<StashContextType | undefined>(undefined);

export function StashProvider({ children }: { children: ReactNode }) {
  const [stash, setStash] = useState<StashItem[]>([]);

  // Load stash from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STASH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStash(parsed);
      }
    } catch (error) {
      console.warn('Failed to load stash from localStorage:', error);
    }
  }, []);

  // Save stash to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STASH_STORAGE_KEY, JSON.stringify(stash));
    } catch (error) {
      console.warn('Failed to save stash to localStorage:', error);
    }
  }, [stash]);

  const addToStash = (item: Omit<StashItem, 'id' | 'savedAt'>) => {
    const newItem: StashItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      savedAt: new Date().toISOString()
    };
    
    // Check if already in stash
    const exists = stash.some(stashItem => 
      stashItem.name === item.name && stashItem.type === item.type
    );
    
    if (!exists) {
      setStash(prev => [newItem, ...prev]);
      return true; // Successfully added
    }
    return false; // Already exists
  };

  const removeFromStash = (id: string) => {
    setStash(prev => prev.filter(item => item.id !== id));
  };

  const clearStash = () => {
    setStash([]);
  };

  const isInStash = (name: string, type: 'band' | 'song' | 'setlist' | 'bandLore') => {
    return stash.some(item => item.name === name && item.type === type);
  };

  const value: StashContextType = {
    stash,
    addToStash,
    removeFromStash,
    clearStash,
    isInStash,
    stashCount: stash.length
  };

  return (
    <StashContext.Provider value={value}>
      {children}
    </StashContext.Provider>
  );
}

export function useStash() {
  const context = useContext(StashContext);
  if (context === undefined) {
    throw new Error('useStash must be used within a StashProvider');
  }
  return context;
}