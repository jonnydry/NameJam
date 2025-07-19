import { useToast } from "@/hooks/use-toast";

export function useClipboard() {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(text);
      }
      
      toast({
        title: "Copied to clipboard!",
        description: `"${text}" has been copied to your clipboard.`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return { copyToClipboard };
}