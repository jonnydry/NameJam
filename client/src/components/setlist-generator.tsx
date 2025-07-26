import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, Music, RefreshCw, ListMusic, Heart, ExternalLink, Lightbulb, Bookmark } from 'lucide-react';
import { LoadingAnimation } from './loading-animation';
import { useStash } from '@/hooks/use-stash';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error-handler';
import { apiRequest } from '@/lib/queryClient';
import { useLoadingProgress } from '@/hooks/use-loading-progress';
import type { SetListResponse, SetListSong } from '@shared/schema';

interface SetListGeneratorProps {
  onCopy: (name: string) => void;
}

export function SetListGenerator({ onCopy }: SetListGeneratorProps) {
  const [songCount, setSongCount] = useState<'8' | '16'>('8');
  const [mood, setMood] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [setList, setSetList] = useState<SetListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedBandName, setGeneratedBandName] = useState<string | null>(null);
  const [loadingBandName, setLoadingBandName] = useState(false);
  const [animatingHearts, setAnimatingHearts] = useState<Map<string, 'add' | 'remove'>>(new Map());
  
  const { toggleStashItem, isInStash, addToStash } = useStash();
  const { toast } = useToast();
  
  // Dynamic loading progress tracking
  const setListProgress = useLoadingProgress({ 
    estimatedDuration: 6000, // 6 seconds for set list generation
    onComplete: () => {
      // Progress animation complete
    }
  });

  const handleGenerateSetList = async () => {
    setLoading(true);
    setError(null);
    setGeneratedBandName(null); // Reset band name when generating new setlist
    setListProgress.startLoading(); // Start progress tracking
    
    try {
      const response = await apiRequest('POST', '/api/generate-setlist', {
        songCount,
        mood: mood && mood !== 'none' ? mood : undefined,
        genre: genre && genre !== 'none' ? genre : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to generate set list');
      }

      const data: SetListResponse = await response.json();
      setSetList(data);
      setListProgress.completeLoading(); // Complete progress
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate set list';
      setError(errorMsg);
      setListProgress.completeLoading(); // Complete progress even on error
      handleApiError(err, {
        title: "Generation failed",
        description: errorMsg,
        showToast: false // Since we're setting error state, no need for toast
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBandName = async () => {
    if (!setList) return;
    
    setLoadingBandName(true);
    
    try {
      // Get all song names from the setlist
      const songNames = [
        ...setList.setOne.map(song => song.name),
        ...setList.setTwo.map(song => song.name),
        setList.finale.name
      ];
      
      const response = await apiRequest('POST', '/api/generate-band-from-setlist', {
        songNames,
        mood: mood && mood !== 'none' ? mood : undefined,
        genre: genre && genre !== 'none' ? genre : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to generate band name');
      }

      const data = await response.json();
      setGeneratedBandName(data.bandName);
      
      toast({
        title: "Band name generated!",
        description: `Imagined band: "${data.bandName}"`,
      });
    } catch (err) {
      handleApiError(err, {
        title: "Generation failed",
        description: err instanceof Error ? err.message : 'Failed to generate band name'
      });
    } finally {
      setLoadingBandName(false);
    }
  };

  const handleAddToStash = (song: SetListSong) => {
    const isCurrentlyInStash = isInStash(song.name, 'song');
    
    // Trigger animation
    setAnimatingHearts(prev => {
      const newMap = new Map(prev);
      newMap.set(song.name, isCurrentlyInStash ? 'remove' : 'add');
      return newMap;
    });
    
    setTimeout(() => {
      setAnimatingHearts(prev => {
        const newMap = new Map(prev);
        newMap.delete(song.name);
        return newMap;
      });
    }, 600);
    
    const { action, success } = toggleStashItem({
      name: song.name,
      type: 'song',
      wordCount: song.name.split(' ').length,
      verification: song.verification,
      isAiGenerated: false, // Setlist songs are always traditional generation
    });
    
    if (action === 'added' && success) {
      toast({
        title: "Added to stash!",
        description: `"${song.name}" has been saved to your stash.`,
      });
    } else if (action === 'removed') {
      toast({
        title: "Removed from stash",
        description: `"${song.name}" has been removed from your stash.`,
      });
    } else if (action === 'added' && !success) {
      toast({
        title: "Already in stash",
        description: `"${song.name}" is already in your stash.`,
        variant: "destructive",
      });
    }
  };

  const handleSaveSetlist = () => {
    if (!setList) return;
    
    const setlistName = `${songCount}-Song Setlist${mood ? ` (${mood})` : ''}${genre ? ` - ${genre}` : ''}`;
    
    const success = addToStash({
      name: setlistName,
      type: 'setlist',
      wordCount: setList.totalSongs,
      setlistData: {
        ...setList,
        mood: mood && mood !== 'none' ? mood : undefined,
        genre: genre && genre !== 'none' ? genre : undefined,
        bandName: generatedBandName || undefined,
      }
    });
    
    if (success) {
      toast({
        title: "Setlist saved!",
        description: `"${setlistName}" has been saved to your stash.`,
      });
    } else {
      toast({
        title: "Already in stash",
        description: `This setlist is already in your stash.`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'similar':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'taken':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'similar':
        return 'Similar exists';
      case 'taken':
        return 'Taken';
      default:
        return 'Unknown';
    }
  };

  const SongCard = ({ song, setName }: { song: SetListSong; setName: string }) => (
    <Card key={song.id} className="bg-neutral-900/30 border-neutral-800 hover:bg-neutral-900/50 transition-colors">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg">{song.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {setName}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(song.verification.status)}`}>
                {getStatusText(song.verification.status)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddToStash(song)}
              className={`transition-colors p-2 ${
                isInStash(song.name, 'song') 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
              title={isInStash(song.name, 'song') ? 'Remove from stash' : 'Add to stash'}
              aria-label={isInStash(song.name, 'song') ? `${song.name} is already in stash` : `Add ${song.name} to stash`}
            >
              <span className={`inline-block ${animatingHearts.has(song.name) ? (animatingHearts.get(song.name) === 'add' ? 'heart-burst' : 'heart-shrink') : ''}`}>
                <Heart className={`w-4 h-4 ${isInStash(song.name, 'song') ? 'fill-current' : ''}`} aria-hidden="true" />
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(song.name)}
              className="text-muted-foreground hover:text-primary transition-colors p-2"
              title="Copy to clipboard"
              aria-label={`Copy ${song.name} to clipboard`}
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            Set List Generator
          </CardTitle>
          <CardDescription>
            Generate organized song lists for your performances - split into two sets plus an encore with varied song lengths
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Song Count</label>
              <Select value={songCount} onValueChange={(value: '8' | '16') => setSongCount(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Songs</SelectItem>
                  <SelectItem value="16">16 Songs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mood</label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Any mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any mood</SelectItem>
                  <SelectItem value="dark">🌑 Dark</SelectItem>
                  <SelectItem value="bright">☀️ Bright</SelectItem>
                  <SelectItem value="mysterious">🔮 Mysterious</SelectItem>
                  <SelectItem value="energetic">⚡ Energetic</SelectItem>
                  <SelectItem value="melancholy">🌧️ Melancholy</SelectItem>
                  <SelectItem value="ethereal">✨ Ethereal</SelectItem>
                  <SelectItem value="aggressive">🔥 Aggressive</SelectItem>
                  <SelectItem value="peaceful">🕊️ Peaceful</SelectItem>
                  <SelectItem value="nostalgic">📚 Nostalgic</SelectItem>
                  <SelectItem value="futuristic">🚀 Futuristic</SelectItem>
                  <SelectItem value="romantic">💕 Romantic</SelectItem>
                  <SelectItem value="epic">⚔️ Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Genre</label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Any genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any genre</SelectItem>
                  <SelectItem value="rock">🎸 Rock</SelectItem>
                  <SelectItem value="metal">🤘 Metal</SelectItem>
                  <SelectItem value="jazz">🎺 Jazz</SelectItem>
                  <SelectItem value="electronic">🎛️ Electronic</SelectItem>
                  <SelectItem value="folk">🪕 Folk</SelectItem>
                  <SelectItem value="classical">🎼 Classical</SelectItem>
                  <SelectItem value="hip-hop">🎤 Hip-Hop</SelectItem>
                  <SelectItem value="country">🤠 Country</SelectItem>
                  <SelectItem value="blues">🎵 Blues</SelectItem>
                  <SelectItem value="reggae">🌴 Reggae</SelectItem>
                  <SelectItem value="punk">⚡ Punk</SelectItem>
                  <SelectItem value="indie">🎨 Indie</SelectItem>
                  <SelectItem value="pop">💫 Pop</SelectItem>
                  <SelectItem value="alternative">🌀 Alternative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            onClick={handleGenerateSetList}
            disabled={loading}
            className="w-full btn-gradient"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Set List...
              </>
            ) : (
              <>
                <Music className="w-4 h-4 mr-2" />
                Generate Set List
              </>
            )}
          </Button>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingAnimation 
            stage="generating"
            actualProgress={setListProgress.progress}
            estimatedDuration={setListProgress.estimatedDuration}
          />
        </div>
      )}

      {setList && !loading && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-neutral-800 to-neutral-700 border-neutral-600">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
                    Your Set List
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {setList.totalSongs} songs organized for your performance
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveSetlist}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                      title="Save this setlist to your stash"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span className="sm:inline">Save Setlist</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateBandName}
                      disabled={loadingBandName}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                      title="Generate a band name that would write this setlist"
                    >
                      <Lightbulb className={`w-4 h-4 ${loadingBandName ? 'animate-pulse' : ''}`} />
                      <span className="sm:inline">Name this Band</span>
                    </Button>
                  </div>
                  {generatedBandName && (
                    <div className="text-sm font-medium text-primary animate-in fade-in-50 duration-500">
                      "{generatedBandName}"
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Set One */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Set One
                <Badge variant="secondary">{setList.setOne.length} songs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {setList.setOne.map((song) => (
                <SongCard key={song.id} song={song} setName="Set 1" />
              ))}
            </CardContent>
          </Card>

          {/* Set Two */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Set Two
                <Badge variant="secondary">{setList.setTwo.length} songs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {setList.setTwo.map((song) => (
                <SongCard key={song.id} song={song} setName="Set 2" />
              ))}
            </CardContent>
          </Card>

          {/* Encore */}
          <Card className="bg-gradient-to-r from-neutral-800 to-neutral-700 border-neutral-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Encore
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  Grand Encore
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SongCard song={setList.finale} setName="Encore" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}