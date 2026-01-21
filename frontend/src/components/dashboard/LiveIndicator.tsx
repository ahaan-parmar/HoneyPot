export const LiveIndicator = () => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
      </span>
      <span className="text-xs font-medium text-destructive uppercase tracking-wider">Live</span>
    </div>
  );
};
