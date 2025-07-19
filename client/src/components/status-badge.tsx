import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: 'available' | 'similar' | 'taken';
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = {
    available: {
      icon: CheckCircle,
      text: "Looks available",
      className: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    similar: {
      icon: AlertCircle,
      text: "Similar exists",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    taken: {
      icon: XCircle,
      text: "In use",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
    },
  };

  const { icon: Icon, text, className: statusClass } = config[status];

  return (
    <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${statusClass} ${className}`}>
      <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
      {text}
    </div>
  );
}