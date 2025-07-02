import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";

interface VerificationResult {
  status: 'available' | 'similar' | 'taken';
  details?: string;
  similarNames?: string[];
  verificationLinks?: Array<{
    name: string;
    url: string;
    source: string;
  }>;
}

interface GenerationResult {
  id: number;
  name: string;
  type: string;
  wordCount: number;
  verification: VerificationResult;
}

interface ResultCardProps {
  result: GenerationResult;
  nameType: 'band' | 'song';
  onCopy: (name: string) => void;
}

export function ResultCard({ result, nameType, onCopy }: ResultCardProps) {
  const { name, verification } = result;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success-green';
      case 'similar':
        return 'bg-warning-yellow';
      case 'taken':
        return 'bg-error-red';
      default:
        return 'bg-neutral-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'similar':
        return 'Similar Found';
      case 'taken':
        return 'Already Taken';
      default:
        return 'Unknown';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-success-green';
      case 'similar':
        return 'text-warning-yellow';
      case 'taken':
        return 'text-error-red';
      default:
        return 'text-neutral-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 ${getStatusColor(verification.status)} rounded-full`}></div>
          <span className={`text-sm font-medium ${getStatusTextColor(verification.status)}`}>
            {getStatusText(verification.status)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(name)}
          className="text-neutral-600 hover:text-google-blue transition-colors p-2"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="text-center">
        <h3 className={`text-2xl font-semibold text-neutral-600 mb-2 ${
          verification.status === 'taken' ? 'line-through' : ''
        }`}>
          {name}
        </h3>
        <p className="text-sm text-neutral-600">
          {verification.details || `No existing ${nameType} found with this name`}
        </p>
        
        {verification.similarNames && verification.similarNames.length > 0 && (
          <div className="mt-4 bg-neutral-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-neutral-600 mb-2">
              {verification.status === 'taken' ? 'Suggested Alternatives:' : 'Similar Names Found:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {verification.similarNames.map((similarName, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border border-neutral-200 text-neutral-600 hover:border-google-blue cursor-pointer transition-colors"
                  onClick={() => onCopy(similarName)}
                >
                  {similarName}
                </span>
              ))}
            </div>
            <p className="text-xs text-neutral-600 mt-2">Click any suggestion to copy it</p>
          </div>
        )}

        {/* Verification Links */}
        {verification.verificationLinks && verification.verificationLinks.length > 0 && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <h4 className="text-sm font-medium text-neutral-600 mb-2">
              Verify Availability:
            </h4>
            <div className="flex flex-wrap gap-2">
              {verification.verificationLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-white border border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  {link.name}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">Click links to search and verify this name's availability</p>
          </div>
        )}
      </div>
    </div>
  );
}
