import { Check, AlertTriangle, X } from "lucide-react";

interface StatusBadgeProps {
  status: 'available' | 'similar' | 'taken';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          icon: <Check className="w-4 h-4" />,
          text: 'Looks available',
          className: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800',
        };
      case 'similar':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Similar exists',
          className: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
        };
      case 'taken':
        return {
          icon: <X className="w-4 h-4" />,
          text: 'Already taken',
          className: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
        };
      default:
        // Fallback for unexpected status values
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Status unknown',
          className: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.className}`}
      role="status"
      aria-label={config.text}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}