import { Trash2, Copy, Heart, Calendar, Music, Users, Download, Printer, FileText, ListMusic, ChevronDown, ChevronRight, ChevronLeft, Brain, BookOpen, Filter, EyeOff, Eye, Star, Sparkles, Menu, Search, X, Check, Upload, Tag, Folder, FolderOpen, Archive, MoreVertical, Hash, Clock, CheckSquare, Square, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStash } from '@/hooks/use-stash';
import { useToast } from '@/hooks/use-toast';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDistanceToNow } from '@/utils/format-time';
import React, { useState, useEffect, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { BandBioModal } from './band-bio-modal';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StashSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Item type icons and colors
const TYPE_CONFIG = {
  band: { 
    icon: Users, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    label: 'Band Names'
  },
  song: { 
    icon: Music, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    label: 'Song Names'
  },
  bandLore: { 
    icon: BookOpen, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    label: 'Band Lore'
  },
  lyricJam: { 
    icon: Mic, 
    color: 'text-green-400', 
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
    label: 'Lyrics'
  }
};

export function StashSidebarEnhanced({ isOpen, onToggle }: StashSidebarProps) {
  const { stash, removeFromStash, clearStash, updateRating } = useStash();
  const { toast } = useToast();
  const { copyToClipboard } = useClipboard();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'band' | 'song' | 'bandLore' | 'lyricJam'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'alphabetical'>('newest');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showBioModal, setShowBioModal] = useState(false);
  const [selectedBandForBio, setSelectedBandForBio] = useState<{ name: string; genre?: string; mood?: string } | null>(null);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById('stash-sidebar-enhanced');
        const toggleBtn = document.getElementById('stash-toggle-btn');
        if (sidebar && !sidebar.contains(e.target as Node) && toggleBtn && !toggleBtn.contains(e.target as Node)) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isOpen) {
        // Cmd/Ctrl + F to focus search
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
          e.preventDefault();
          document.getElementById('stash-search')?.focus();
        }
        // Escape to close
        if (e.key === 'Escape') {
          if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedItems(new Set());
          } else {
            onToggle();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onToggle, isSelectionMode]);

  // Filter and sort stash items
  const filteredAndSortedStash = useMemo(() => {
    let filtered = stash;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        (item.genre && item.genre.toLowerCase().includes(query)) ||
        (item.mood && item.mood.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.type === categoryFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        case 'oldest':
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        case 'rating-high':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating-low':
          return (a.rating || 0) - (b.rating || 0);
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [stash, searchQuery, categoryFilter, sortBy]);

  // Group items by type for category view
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof filteredAndSortedStash> = {};
    filteredAndSortedStash.forEach(item => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
    });
    return groups;
  }, [filteredAndSortedStash]);

  // Handlers
  const handleRemove = (id: string, name: string) => {
    removeFromStash(id);
    toast({
      title: "Removed from stash",
      description: `"${name}" has been removed.`,
    });
    // Remove from selection if in selection mode
    if (selectedItems.has(id)) {
      const newSelection = new Set(selectedItems);
      newSelection.delete(id);
      setSelectedItems(newSelection);
    }
  };

  const handleBulkRemove = () => {
    const count = selectedItems.size;
    selectedItems.forEach(id => {
      const item = stash.find(i => i.id === id);
      if (item) removeFromStash(id);
    });
    toast({
      title: "Bulk removal complete",
      description: `${count} items have been removed.`,
    });
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedStash.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedStash.map(item => item.id)));
    }
  };

  const handleClearAll = () => {
    clearStash();
    toast({
      title: "Stash cleared",
      description: "All saved names have been removed.",
    });
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleRating = (id: string, rating: number) => {
    updateRating(id, rating);
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleBioRequest = (bandName: string, genre?: string, mood?: string) => {
    setSelectedBandForBio({ name: bandName, genre, mood });
    setShowBioModal(true);
  };

  const handleExportSelected = () => {
    const selectedStash = stash.filter(item => selectedItems.has(item.id));
    const timestamp = new Date().toISOString().split('T')[0];
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      selectedCount: selectedStash.length,
      items: selectedStash
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namejam-selected-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `${selectedStash.length} items exported successfully.`,
    });
  };

  // StarRating component with enhanced styling
  const StarRating = ({ rating, itemId }: { rating?: number; itemId: string }) => {
    const [hoveredRating, setHoveredRating] = useState(0);

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-transparent transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              handleRating(itemId, star);
            }}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-all duration-200",
                star <= (hoveredRating || rating || 0)
                  ? 'fill-yellow-400 text-yellow-400 scale-110'
                  : 'text-muted-foreground hover:text-yellow-400/50'
              )}
            />
          </Button>
        ))}
      </div>
    );
  };

  // Enhanced item card component
  const ItemCard = ({ item }: { item: any }) => {
    const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.band; // fallback to band config
    const Icon = config.icon;
    const isSelected = selectedItems.has(item.id);

    return (
      <div
        className={cn(
          "group relative transition-all duration-200",
          isSelectionMode && "cursor-pointer",
          isSelected && "scale-[0.98]"
        )}
        onClick={() => {
          if (isSelectionMode) {
            const newSelection = new Set(selectedItems);
            if (newSelection.has(item.id)) {
              newSelection.delete(item.id);
            } else {
              newSelection.add(item.id);
            }
            setSelectedItems(newSelection);
          }
        }}
      >
        <Card className={cn(
          "overflow-hidden transition-all duration-200",
          "hover:shadow-lg hover:border-primary/20",
          isSelected && "ring-2 ring-primary/50 bg-primary/5",
          config.borderColor
        )}>
          <CardContent className="p-3">
            {/* Selection checkbox */}
            {isSelectionMode && (
              <div className="absolute top-3 left-3 z-10">
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            )}

            <div className={cn(
              "flex items-start gap-3",
              isSelectionMode && "pl-7"
            )}>
              {/* Type icon */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                config.bgColor
              )}>
                <Icon className={cn("w-5 h-5", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {item.type === 'lyricJam' ? (
                      <p className="text-sm italic leading-relaxed">"{item.name}"</p>
                    ) : (
                      <p className="text-sm font-medium">{item.name}</p>
                    )}
                    
                    {/* Meta info */}
                    <div className="space-y-1.5 mt-1">
                      <Badge variant="secondary" className="text-xs whitespace-nowrap flex-shrink-0">
                        {config.label}
                      </Badge>
                      {(item.genre || item.mood) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.genre && (
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {item.genre}
                            </Badge>
                          )}
                          {item.mood && (
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {item.mood}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="mt-2">
                      <StarRating rating={item.rating} itemId={item.id} />
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(item.savedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isSelectionMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyToClipboard(item.name)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        {item.type === 'band' && (
                          <DropdownMenuItem onClick={() => handleBioRequest(item.name, item.genre, item.mood)}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Generate Bio
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleRemove(item.id, item.name)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Enhanced Sidebar */}
      <div
        id="stash-sidebar-enhanced"
        className={cn(
          "fixed top-0 left-0 h-full bg-background/80 backdrop-blur-sm border-r border-border/50 z-50",
          "transition-all duration-300 ease-in-out shadow-xl",
          "w-full sm:w-96 md:w-[420px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Enhanced Header */}
          <div className="bg-background/50 backdrop-blur-sm border-b border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">My Collection</h2>
                <Badge variant="secondary" className="ml-1">
                  {stash.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0 bg-transparent hover:bg-white/10 transition-all"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="stash-search"
                type="text"
                placeholder="Search your collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9 bg-black/20 backdrop-blur-sm border-white/10 text-white placeholder:text-gray-500 focus:bg-black/30 focus:border-white/20 transition-all"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-background/60"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2">
              {/* Selection Mode Toggle */}
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedItems(new Set());
                }}
                className={cn(
                  "h-8",
                  !isSelectionMode && "bg-background/60 backdrop-blur-sm border-border/50 hover:bg-background/80"
                )}
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                Select
              </Button>

              {/* Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 bg-background/60 backdrop-blur-sm border-border/50 hover:bg-background/80">
                    <Filter className="h-3 w-3 mr-1" />
                    {categoryFilter === 'all' ? 'All' : (TYPE_CONFIG[categoryFilter]?.label || 'Unknown')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                    <DropdownMenuItem 
                      key={key} 
                      onClick={() => setCategoryFilter(key as any)}
                    >
                      <config.icon className={cn("h-4 w-4 mr-2", config.color)} />
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 bg-background/60 backdrop-blur-sm border-border/50 hover:bg-background/80">
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('rating-high')}>
                    Highest Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('rating-low')}>
                    Lowest Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                    A to Z
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 bg-background/60 backdrop-blur-sm border-border/50 hover:bg-background/80">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.alert('Import feature coming soon!')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.alert('Export feature')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleClearAll}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Selection Actions */}
            {isSelectionMode && selectedItems.size > 0 && (
              <div className="flex items-center justify-between mt-3 p-2 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedItems.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 text-xs"
                  >
                    {selectedItems.size === filteredAndSortedStash.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportSelected}
                    className="h-7 text-xs"
                  >
                    Export
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkRemove}
                    className="h-7 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAndSortedStash.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {stash.length === 0 ? (
                  <>
                    <Archive className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">Your collection is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save your favorite names to access them here
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">No results found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your search or filters
                    </p>
                  </>
                )}
              </div>
            ) : (
              // Items list with category grouping
              categoryFilter === 'all' ? (
                // Grouped view
                Object.entries(groupedItems).map(([type, items]) => {
                  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.band; // fallback to band config
                  const Icon = config.icon;
                  const isCollapsed = collapsedCategories.has(type);

                  return (
                    <div key={type} className="space-y-2">
                      <button
                        onClick={() => toggleCategory(type)}
                        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <Icon className={cn("w-4 h-4", config.color)} />
                        <span className="font-medium text-sm">{config.label}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {items.length}
                        </Badge>
                      </button>
                      
                      {!isCollapsed && (
                        <div className="space-y-2 pl-6">
                          {items.map(item => (
                            <ItemCard key={item.id} item={item} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Flat view
                filteredAndSortedStash.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* Bio Modal */}
      {selectedBandForBio && (
        <BandBioModal
          bandName={selectedBandForBio.name}
          genre={selectedBandForBio.genre}
          mood={selectedBandForBio.mood}
          open={showBioModal}
          onOpenChange={setShowBioModal}
        />
      )}
    </>
  );
}