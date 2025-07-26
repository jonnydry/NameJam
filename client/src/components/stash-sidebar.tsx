import { Trash2, Copy, Heart, Calendar, Music, Users, Download, Printer, FileText, ListMusic, ChevronDown, ChevronRight, Brain, BookOpen, Filter, EyeOff, Eye, Star, Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStash } from '@/hooks/use-stash';
import { useToast } from '@/hooks/use-toast';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDistanceToNow } from '@/utils/format-time';
import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BandBioModal } from './band-bio-modal';
import { cn } from '@/lib/utils';

interface StashSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function StashSidebar({ isOpen, onToggle }: StashSidebarProps) {
  const { stash, removeFromStash, clearStash, updateRating } = useStash();
  const { toast } = useToast();
  const { copyToClipboard } = useClipboard();
  const [expandedSetlists, setExpandedSetlists] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'band' | 'song' | 'setlist' | 'bandLore' | 'lyricJam'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'alphabetical'>('newest');
  const [showBioModal, setShowBioModal] = useState(false);
  const [selectedBandForBio, setSelectedBandForBio] = useState<{ name: string; genre?: string; mood?: string } | null>(null);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById('stash-sidebar');
        const toggleBtn = document.getElementById('stash-toggle-btn');
        if (sidebar && !sidebar.contains(e.target as Node) && toggleBtn && !toggleBtn.contains(e.target as Node)) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const handleRemove = (id: string, name: string) => {
    removeFromStash(id);
    toast({
      title: "Removed from stash",
      description: `"${name}" has been removed.`,
    });
  };

  const handleClearAll = () => {
    clearStash();
    toast({
      title: "Stash cleared",
      description: "All saved names have been removed.",
    });
  };

  const handleRating = (id: string, rating: number) => {
    updateRating(id, rating);
    toast({
      title: "Rating updated",
      description: `Rated ${rating} star${rating !== 1 ? 's' : ''}`,
    });
  };

  // StarRating component
  const StarRating = ({ rating, itemId }: { rating?: number; itemId: string }) => {
    const [hoveredRating, setHoveredRating] = useState(0);

    return (
      <div className="flex items-center space-x-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={() => handleRating(itemId, star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            <Star
              className={`w-4 h-4 ${
                star <= (hoveredRating || rating || 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
        ))}
        {rating && (
          <span className="text-xs text-muted-foreground ml-2">
            {rating}/5
          </span>
        )}
      </div>
    );
  };

  // Sort stash items
  const sortedStash = stash
    .filter(item => categoryFilter === 'all' || item.type === categoryFilter)
    .sort((a, b) => {
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

  const handleExportTxt = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let content = `NameJam Stash Export - ${timestamp}\n`;
    content += `Generated on ${new Date().toLocaleDateString()}\n\n`;
    
    const bandNames = stash.filter(item => item.type === 'band');
    const songNames = stash.filter(item => item.type === 'song');
    const setlists = stash.filter(item => item.type === 'setlist');
    const bandLore = stash.filter(item => item.type === 'bandLore');
    const lyrics = stash.filter(item => item.type === 'lyricJam');
    
    if (bandNames.length > 0) {
      content += `BAND NAMES (${bandNames.length}):\n`;
      content += bandNames.map((item, index) => `${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}`).join('\n');
      content += '\n\n';
    }
    
    if (songNames.length > 0) {
      content += `SONG NAMES (${songNames.length}):\n`;
      content += songNames.map((item, index) => `${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}`).join('\n');
      content += '\n\n';
    }
    
    if (setlists.length > 0) {
      content += `SET LISTS (${setlists.length}):\n`;
      setlists.forEach((item, index) => {
        content += `\n${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}\n`;
        if (item.setlistData) {
          content += `   Set One:\n`;
          item.setlistData.setOne.forEach((song, i) => {
            content += `     ${i + 1}. ${song.name}\n`;
          });
          content += `   Set Two:\n`;
          item.setlistData.setTwo.forEach((song, i) => {
            content += `     ${i + 1}. ${song.name}\n`;
          });
          content += `   Encore: ${item.setlistData.finale.name}\n`;
          if (item.setlistData.bandName) {
            content += `   Band Name: ${item.setlistData.bandName}\n`;
          }
        }
      });
      content += '\n';
    }
    
    if (bandLore.length > 0) {
      content += `BAND LORE (${bandLore.length}):\n`;
      bandLore.forEach((item, index) => {
        content += `\n${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}\n`;
        if (item.bandLoreData?.bio) {
          content += `   ${item.bandLoreData.bio.substring(0, 200)}...\n`;
        }
      });
      content += '\n';
    }

    if (lyrics.length > 0) {
      content += `LYRICS (${lyrics.length}):\n`;
      lyrics.forEach((item, index) => {
        content += `\n${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}\n`;
      });
      content += '\n';
    }
    
    content += `\nTotal saved items: ${stash.length}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namejam-stash-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      stats: {
        total: stash.length,
        bandNames: stash.filter(item => item.type === 'band').length,
        songNames: stash.filter(item => item.type === 'song').length,
        setlists: stash.filter(item => item.type === 'setlist').length,
        bandLore: stash.filter(item => item.type === 'bandLore').length,
        lyrics: stash.filter(item => item.type === 'lyricJam').length,
      },
      items: stash
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namejam-stash-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NameJam Stash - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          h1 { color: #333; }
          h2 { color: #666; margin-top: 20px; }
          .item { margin: 10px 0; }
          .setlist-content { margin-left: 20px; white-space: pre-line; }
          .bio-preview { margin-left: 20px; color: #666; font-style: italic; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>NameJam Stash Export</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        
        ${stash.filter(item => item.type === 'band').length > 0 ? `
          <h2>Band Names (${stash.filter(item => item.type === 'band').length})</h2>
          ${stash.filter(item => item.type === 'band').map((item, index) => 
            `<div class="item">${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}</div>`
          ).join('')}
        ` : ''}
        
        ${stash.filter(item => item.type === 'song').length > 0 ? `
          <h2>Song Names (${stash.filter(item => item.type === 'song').length})</h2>
          ${stash.filter(item => item.type === 'song').map((item, index) => 
            `<div class="item">${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}</div>`
          ).join('')}
        ` : ''}
        
        ${stash.filter(item => item.type === 'setlist').length > 0 ? `
          <h2>Set Lists (${stash.filter(item => item.type === 'setlist').length})</h2>
          ${stash.filter(item => item.type === 'setlist').map((item, index) => {
            let setlistContent = '';
            if (item.setlistData) {
              setlistContent += '<div class="setlist-content">Set One:<br/>';
              item.setlistData.setOne.forEach((song, i) => {
                setlistContent += `${i + 1}. ${song.name}<br/>`;
              });
              setlistContent += '<br/>Set Two:<br/>';
              item.setlistData.setTwo.forEach((song, i) => {
                setlistContent += `${i + 1}. ${song.name}<br/>`;
              });
              setlistContent += `<br/>Encore: ${item.setlistData.finale.name}</div>`;
              if (item.setlistData.bandName) {
                setlistContent += `<div class="setlist-content">Band Name: ${item.setlistData.bandName}</div>`;
              }
            }
            return `<div class="item">
              <strong>${index + 1}. ${item.name}</strong>${item.rating ? ` (${item.rating}/5 stars)` : ''}
              ${setlistContent}
            </div>`;
          }).join('')}
        ` : ''}
        
        ${stash.filter(item => item.type === 'bandLore').length > 0 ? `
          <h2>Band Lore (${stash.filter(item => item.type === 'bandLore').length})</h2>
          ${stash.filter(item => item.type === 'bandLore').map((item, index) => 
            `<div class="item">
              <strong>${index + 1}. ${item.name}</strong>${item.rating ? ` (${item.rating}/5 stars)` : ''}
              ${item.bandLoreData?.bio ? `<div class="bio-preview">${item.bandLoreData.bio.substring(0, 200)}...</div>` : ''}
            </div>`
          ).join('')}
        ` : ''}

        ${stash.filter(item => item.type === 'lyricJam').length > 0 ? `
          <h2>Lyrics (${stash.filter(item => item.type === 'lyricJam').length})</h2>
          ${stash.filter(item => item.type === 'lyricJam').map((item, index) => 
            `<div class="item">${index + 1}. ${item.name}${item.rating ? ` (${item.rating}/5 stars)` : ''}</div>`
          ).join('')}
        ` : ''}
        
        <p style="margin-top: 30px;"><strong>Total saved items: ${stash.length}</strong></p>
      </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleSetlist = (id: string) => {
    setExpandedSetlists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBioRequest = (bandName: string, genre?: string, mood?: string) => {
    setSelectedBandForBio({ name: bandName, genre, mood });
    setShowBioModal(true);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        id="stash-sidebar"
        className={cn(
          "fixed top-0 left-0 h-full bg-background border-r border-border z-50 transition-transform duration-300 ease-in-out",
          "w-80 md:w-96",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Stash ({stash.length})</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Filter className="h-3 w-3 mr-1" />
                    {categoryFilter === 'all' ? 'All Categories' : 
                     categoryFilter === 'band' ? 'Band Names' :
                     categoryFilter === 'song' ? 'Song Names' :
                     categoryFilter === 'setlist' ? 'Set Lists' :
                     categoryFilter === 'bandLore' ? 'Band Lore' :
                     'Lyrics'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px]">
                  <DropdownMenuItem onClick={() => setCategoryFilter('all')}>All Categories</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('band')}>Band Names</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('song')}>Song Names</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('setlist')}>Set Lists</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('bandLore')}>Band Lore</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('lyricJam')}>Lyrics</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('oldest')}>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('rating-high')}>Highest Rating</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('rating-low')}>Lowest Rating</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>Alphabetical</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px]">
                  <DropdownMenuItem onClick={handleExportTxt}>
                    <FileText className="h-4 w-4 mr-2" />
                    Text File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJson}>
                    <FileText className="h-4 w-4 mr-2" />
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear All */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                disabled={stash.length === 0}
                className="w-full justify-start"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {stash.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Your stash is empty.</p>
                <p className="mt-1">Save your favorite names to access them here!</p>
              </div>
            ) : sortedStash.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No items match your filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStash.map((item) => (
                  <Card key={item.id} className="relative group">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium break-all">{item.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.type === 'band' ? <Users className="h-3 w-3" /> : 
                               item.type === 'setlist' ? <ListMusic className="h-3 w-3" /> :
                               item.type === 'bandLore' ? <BookOpen className="h-3 w-3" /> :
                               item.type === 'lyricJam' ? <Sparkles className="h-3 w-3" /> :
                               <Music className="h-3 w-3" />}
                            </Badge>
                            {item.isAiGenerated && (
                              <Badge variant="secondary" className="text-xs">
                                <Brain className="h-3 w-3 text-purple-500" />
                              </Badge>
                            )}
                          </div>
                          
                          {/* Setlist Preview */}
                          {item.type === 'setlist' && item.setlistData && (
                            <div className="mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 p-0 text-xs text-muted-foreground hover:text-primary"
                                onClick={() => toggleSetlist(item.id)}
                              >
                                {expandedSetlists.has(item.id) ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                                {expandedSetlists.has(item.id) ? 'Hide' : 'Show'} set list
                              </Button>
                              {expandedSetlists.has(item.id) && (
                                <div className="mt-2 text-xs text-muted-foreground border-l-2 border-muted pl-3">
                                  <div className="font-medium mb-1">Set One:</div>
                                  {item.setlistData.setOne.map((song, i) => (
                                    <div key={i}>{i + 1}. {song.name}</div>
                                  ))}
                                  <div className="font-medium mt-2 mb-1">Set Two:</div>
                                  {item.setlistData.setTwo.map((song, i) => (
                                    <div key={i}>{i + 1}. {song.name}</div>
                                  ))}
                                  <div className="font-medium mt-2">Encore: {item.setlistData.finale.name}</div>
                                  {item.setlistData.bandName && (
                                    <div className="mt-2 font-medium">
                                      Band Name: {item.setlistData.bandName}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Band Lore Preview */}
                          {item.type === 'bandLore' && item.bandLoreData?.bio && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {item.bandLoreData.bio.substring(0, 100)}...
                              {item.bandLoreData.model && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {item.bandLoreData.model}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(item.savedAt))}
                            </span>
                          </div>
                          
                          <StarRating rating={item.rating} itemId={item.id} />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              copyToClipboard(item.name);
                              toast({
                                title: "Copied!",
                                description: `"${item.name}" copied to clipboard`,
                              });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {item.type === 'band' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBioRequest(item.name, item.genre, item.mood)}
                              className="h-8 w-8 p-0"
                            >
                              <BookOpen className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.id, item.name)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Band Bio Modal */}
      {showBioModal && selectedBandForBio && (
        <BandBioModal
          open={showBioModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowBioModal(false);
              setSelectedBandForBio(null);
            }
          }}
          bandName={selectedBandForBio.name}
          genre={selectedBandForBio.genre}
          mood={selectedBandForBio.mood}
        />
      )}
    </>
  );
}