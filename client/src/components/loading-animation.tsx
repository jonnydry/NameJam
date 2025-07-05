interface LoadingAnimationProps {
  stage: 'generating' | 'verifying';
}

export function LoadingAnimation({ stage }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      {stage === 'generating' ? (
        <>
          {/* Musical Loading Animation */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-musical-note"></div>
            <div className="w-3 h-3 bg-muted-foreground rounded-full animate-musical-note" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-foreground rounded-full animate-musical-note" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <div className="text-lg text-foreground font-medium">Generating unique names...</div>
          <div className="text-sm text-muted-foreground">Searching the web for word combinations</div>
        </>
      ) : (
        <>
          {/* Verification Loading Animation */}
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-foreground font-medium">Verifying name availability...</div>
          <div className="text-sm text-muted-foreground">Checking against existing artists and songs</div>
        </>
      )}
    </div>
  );
}
