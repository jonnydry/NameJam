import { Trash2, Copy, Heart, Calendar, Music, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStash } from '@/hooks/use-stash';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export function Stash() {
  const { stash, removeFromStash, clearStash } = useStash();
  const { toast } = useToast();

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    toast({
      title: "Copied to clipboard!",
      description: `"${name}" has been copied.`,
    });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Your Stash</h2>
          <Badge variant="secondary">{stash.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="grid gap-3">
        {stash.map((item) => (
          <Card key={item.id} className="bg-card/50 hover:bg-card/80 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {item.type === 'band' ? (
                      <Users className="w-4 h-4 text-primary" />
                    ) : (
                      <Music className="w-4 h-4 text-primary" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {item.type} • {item.wordCount} word{item.wordCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-base mb-1 break-words">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Saved {formatDistanceToNow(new Date(item.savedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {item.verification.status && (
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
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(item.name)}
                    className="h-8 w-8 hover:bg-primary/20"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id, item.name)}
                    className="h-8 w-8 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}