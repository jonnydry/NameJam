import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  handler: () => void;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export function KeyboardHint({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {keys.map((key, index) => (
        <kbd 
          key={index}
          className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-xs"
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}