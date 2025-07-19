import { Trash2, Copy, Heart, Calendar, Music, Users, Download, Printer, FileText, ListMusic, ChevronDown, ChevronRight, Brain, BookOpen, Filter, EyeOff, Eye, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStash } from '@/hooks/use-stash';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BandBioModal } from './band-bio-modal';

export function Stash() {
  const { stash, removeFromStash, clearStash, updateRating } = useStash();
  const { toast } = useToast();
  const [expandedSetlists, setExpandedSetlists] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'band' | 'song' | 'setlist' | 'bandLore' | 'lyricJam'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'alphabetical'>('newest');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [selectedBandForBio, setSelectedBandForBio] = useState<{ name: string; genre?: string; mood?: string } | null>(null);

  const handleCopy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast({
        title: "Copied to clipboard!",
        description: `"${name}" has been copied.`,
      });
    } catch (error) {
      // Fallback for older browsers or HTTP contexts
      const textArea = document.createElement('textarea');
      textArea.value = name;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: "Copied to clipboard!",
          description: `"${name}" has been copied.`,
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Please copy the text manually.",
          variant: "destructive",
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

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
      content += `SETLISTS (${setlists.length}):\n`;
      content += setlists.map((item, index) => `${index + 1}. ${item.name} (${item.wordCount} songs)${item.rating ? ` (${item.rating}/5 stars)` : ''}`).join('\n');
      content += '\n\n';
    }
    
    if (bandLore.length > 0) {
      content += `BAND LORE (${bandLore.length}):\n`;
      bandLore.forEach((item, index) => {
        content += `${index + 1}. ${item.name}\n`;
        if (item.bandLoreData) {
          content += `   ${item.bandLoreData.bio.substring(0, 100)}...\n`;
        }
      });
      content += '\n\n';
    }

    const lyricJams = stash.filter(item => item.type === 'lyricJam');
    if (lyricJams.length > 0) {
      content += `LYRIC STARTERS (${lyricJams.length}):\n`;
      lyricJams.forEach((item, index) => {
        content += `${index + 1}. "${item.name}"`;
        if (item.metadata?.songSection) {
          content += ` [${item.metadata.songSection.toUpperCase()}]`;
        }
        if (item.rating) {
          content += ` (${item.rating}/5 stars)`;
        }
        content += '\n';
      });
      content += '\n\n';
    }
    
    content += `Total saved names: ${stash.length}\n`;
    content += `Generated by NameJam - The Ultimate Music Name Generator`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namejam-stash-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful!",
      description: `Downloaded ${stash.length} names to text file.`,
    });
  };

  const handleExportJson = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const exportData = {
      exportDate: new Date().toISOString(),
      totalNames: stash.length,
      bandNames: stash.filter(item => item.type === 'band').length,
      songNames: stash.filter(item => item.type === 'song').length,
      setlists: stash.filter(item => item.type === 'setlist').length,
      bandLore: stash.filter(item => item.type === 'bandLore').length,
      lyricJams: stash.filter(item => item.type === 'lyricJam').length,
      items: stash.map(item => ({
        name: item.name,
        type: item.type,
        savedAt: item.savedAt,
        wordCount: item.wordCount,
        rating: item.rating,
        ...(item.type === 'bandLore' && item.bandLoreData ? {
          bio: item.bandLoreData.bio,
          model: item.bandLoreData.model,
          bandName: item.bandLoreData.bandName
        } : {}),
        ...(item.type === 'setlist' && item.setlistData ? {
          totalSongs: item.setlistData.totalSongs,
          bandName: item.setlistData.bandName
        } : {})
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namejam-stash-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful!",
      description: `Downloaded ${stash.length} names to JSON file.`,
    });
  };

  const toggleSetlistExpansion = (setlistId: string) => {
    setExpandedSetlists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setlistId)) {
        newSet.delete(setlistId);
      } else {
        newSet.add(setlistId);
      }
      return newSet;
    });
  };

  const handlePrint = () => {
    const timestamp = new Date().toLocaleDateString();
    const bandNames = stash.filter(item => item.type === 'band');
    const songNames = stash.filter(item => item.type === 'song');
    const setlists = stash.filter(item => item.type === 'setlist');
    const bandLore = stash.filter(item => item.type === 'bandLore');
    const lyricJams = stash.filter(item => item.type === 'lyricJam');
    
    let printContent = `
      <html>
        <head>
          <title>NameJam Stash - ${timestamp}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #1e293b; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
            h2 { color: #334155; margin-top: 30px; }
            .name-list { columns: 2; column-gap: 40px; }
            .name-item { margin-bottom: 8px; break-inside: avoid; }
            .header { text-align: center; margin-bottom: 30px; }
            .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }
            .stats { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NameJam Stash</h1>
            <p>Your saved band and song names - Generated on ${timestamp}</p>
          </div>
          
          <div class="stats">
            <strong>Summary:</strong> ${stash.length} total items saved
            ${bandNames.length > 0 ? `• ${bandNames.length} band names` : ''}
            ${songNames.length > 0 ? `• ${songNames.length} song names` : ''}
            ${setlists.length > 0 ? `• ${setlists.length} setlists` : ''}
            ${bandLore.length > 0 ? `• ${bandLore.length} band lore` : ''}
            ${lyricJams.length > 0 ? `• ${lyricJams.length} lyric starters` : ''}
          </div>
    `;
    
    if (bandNames.length > 0) {
      printContent += `
        <h2>Band Names (${bandNames.length})</h2>
        <div class="name-list">
          ${bandNames.map((item, index) => 
            `<div class="name-item">${index + 1}. <strong>${item.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>${item.rating ? ` (${item.rating}/5 stars)` : ''}</div>`
          ).join('')}
        </div>
      `;
    }
    
    if (songNames.length > 0) {
      printContent += `
        <h2>Song Names (${songNames.length})</h2>
        <div class="name-list">
          ${songNames.map((item, index) => 
            `<div class="name-item">${index + 1}. <strong>${item.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>${item.rating ? ` (${item.rating}/5 stars)` : ''}</div>`
          ).join('')}
        </div>
      `;
    }
    
    if (lyricJams.length > 0) {
      printContent += `
        <h2>Lyric Starters (${lyricJams.length})</h2>
        <div class="name-list">
          ${lyricJams.map((item, index) => 
            `<div class="name-item">${index + 1}. <strong>"${item.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"</strong>${item.metadata?.songSection ? ` [${item.metadata.songSection.toUpperCase()}]` : ''}${item.rating ? ` (${item.rating}/5 stars)` : ''}</div>`
          ).join('')}
        </div>
      `;
    }
    
    printContent += `
          <div class="footer">
            Generated by NameJam - The Ultimate Music Name Generator<br>
            Visit NameJam to generate more amazing names!
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
    
    toast({
      title: "Print ready!",
      description: "Opening print dialog for your stash.",
    });
  };



  if (stash.length === 0) {
    return (
      <Card className="bg-muted/50 border-muted">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Your Stash is Empty</CardTitle>
          <CardDescription>
            Save your favorite names by clicking the heart icon on any generated name.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Your Stash</h2>
          <Badge variant="secondary">{stash.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isMinimized ? (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show Stash
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide Stash
            </>
          )}
        </Button>
      </div>

      {/* Control Buttons - Organized in 2x2 grid with aligned spacing */}
      {!isMinimized && (
        <div className="grid grid-cols-2 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Filter className="w-4 h-4 mr-2" />
                {categoryFilter === 'all' ? 'All Categories' : 
                 categoryFilter === 'band' ? 'Band Names' :
                 categoryFilter === 'song' ? 'Song Names' :
                 categoryFilter === 'setlist' ? 'Setlists' :
                 categoryFilter === 'bandLore' ? 'Band Lore' :
                 'Lyric Starters'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                <Heart className="w-4 h-4 mr-2" />
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCategoryFilter('band')}>
                <Users className="w-4 h-4 mr-2" />
                Band Names
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('song')}>
                <Music className="w-4 h-4 mr-2" />
                Song Names
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('setlist')}>
                <ListMusic className="w-4 h-4 mr-2" />
                Setlists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('bandLore')}>
                <BookOpen className="w-4 h-4 mr-2" />
                Band Lore
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('lyricJam')}>
                <Music className="w-4 h-4 mr-2" />
                Lyric Starters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Star className="w-4 h-4 mr-2" />
                {sortBy === 'newest' ? 'Newest First' :
                 sortBy === 'oldest' ? 'Oldest First' :
                 sortBy === 'rating-high' ? 'Highest Rated' :
                 sortBy === 'rating-low' ? 'Lowest Rated' :
                 'Alphabetical'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                <Calendar className="w-4 h-4 mr-2" />
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                <Calendar className="w-4 h-4 mr-2" />
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('rating-high')}>
                <Star className="w-4 h-4 mr-2" />
                Highest Rated
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('rating-low')}>
                <Star className="w-4 h-4 mr-2" />
                Lowest Rated
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                <Music className="w-4 h-4 mr-2" />
                Alphabetical
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleExportTxt}>
                <FileText className="w-4 h-4 mr-2" />
                Export as Text File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJson}>
                <Download className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print Stash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      )}

      {!isMinimized && (
        <div className="grid gap-3">
        {sortedStash.map((item) => (
          <Card key={item.id} className="bg-card/50 hover:bg-card/80 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {item.type === 'band' ? (
                      <Users className="w-4 h-4 text-primary" />
                    ) : item.type === 'setlist' ? (
                      <ListMusic className="w-4 h-4 text-primary" />
                    ) : item.type === 'bandLore' ? (
                      <Brain className="w-4 h-4 text-purple-500" />
                    ) : item.type === 'lyricJam' ? (
                      <Brain className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Music className="w-4 h-4 text-primary" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {item.type === 'setlist' ? `setlist • ${item.wordCount} songs` : 
                       item.type === 'bandLore' ? `band lore • ${item.wordCount} words` :
                       item.type === 'lyricJam' ? `lyric starter • ${item.wordCount} words` :
                       `${item.type} • ${item.wordCount} word${item.wordCount !== 1 ? 's' : ''}`}
                    </Badge>
                    {item.isAiGenerated && item.type !== 'bandLore' && item.type !== 'lyricJam' && (
                      <Brain className="w-4 h-4 text-purple-500" title="AI Generated" />
                    )}
                  </div>
                  
                  {item.type === 'setlist' ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSetlistExpansion(item.id)}
                          className="h-auto p-0 hover:bg-transparent"
                        >
                          {expandedSetlists.has(item.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <h3 className="font-medium text-base break-words cursor-pointer" 
                            onClick={() => toggleSetlistExpansion(item.id)}>
                          {item.name}
                        </h3>
                      </div>
                      
                      {item.setlistData?.bandName && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Band: <span className="font-medium">{item.setlistData.bandName}</span>
                        </div>
                      )}
                      
                      {expandedSetlists.has(item.id) && item.setlistData && (
                        <div className="mt-3 space-y-3 border-l-2 border-muted pl-4">
                          {/* Set One */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Set One ({item.setlistData.setOne.length} songs)</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {item.setlistData.setOne.map((song, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span className="w-6 text-right">{idx + 1}.</span>
                                  <span>{song.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Set Two */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Set Two ({item.setlistData.setTwo.length} songs)</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {item.setlistData.setTwo.map((song, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span className="w-6 text-right">{idx + 1}.</span>
                                  <span>{song.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Encore */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Encore</h4>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="w-6 text-right">♦</span>
                              <span>{item.setlistData.finale.name}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : item.type === 'bandLore' && item.bandLoreData ? (
                    <div>
                      <h3 className="font-medium text-base mb-1 break-words">
                        {item.name}
                      </h3>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="line-clamp-3">{item.bandLoreData.bio}</p>
                        {item.bandLoreData.model && (
                          <div className="mt-1 text-xs">
                            Generated by: {item.bandLoreData.model}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : item.type === 'lyricJam' ? (
                    <div>
                      <h3 className="font-medium text-base mb-1 break-words italic">
                        "{item.name}"
                      </h3>
                      {item.metadata?.songSection && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.metadata.songSection.toUpperCase()}
                        </Badge>
                      )}
                      {item.metadata?.model && item.metadata.model !== 'fallback' && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Generated by {item.metadata.model}
                        </div>
                      )}
                    </div>
                  ) : (
                    <h3 className="font-medium text-base mb-1 break-words">
                      {item.name}
                    </h3>
                  )}
                  
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Saved {formatDistanceToNow(new Date(item.savedAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {item.verification?.status && (
                    <div className="mt-2">
                      <Badge 
                        variant={
                          item.verification.status === 'available' ? 'default' :
                          item.verification.status === 'similar' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {item.verification.status}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Star Rating */}
                  <StarRating rating={item.rating} itemId={item.id} />
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  {item.type === 'band' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedBandForBio({ 
                          name: item.name,
                          genre: item.genre,
                          mood: item.mood
                        });
                        setShowBioModal(true);
                      }}
                      className="h-8 w-8 hover:bg-purple-500/20 text-muted-foreground hover:text-purple-500"
                      title="Generate band bio"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(item.type === 'bandLore' && item.bandLoreData ? item.bandLoreData.bio : item.name)}
                    className="h-8 w-8 hover:bg-primary/20"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id, item.name)}
                    className="h-8 w-8 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    title="Remove from stash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
      {showBioModal && selectedBandForBio && (
        <BandBioModal
          bandName={selectedBandForBio.name}
          genre={selectedBandForBio.genre}
          mood={selectedBandForBio.mood}
          open={showBioModal}
          onOpenChange={setShowBioModal}
        />
      )}
    </div>
  );
}