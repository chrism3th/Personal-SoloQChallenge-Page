export function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-loss">
      <span className="live-pulse h-2 w-2 rounded-full bg-loss" aria-hidden />
      En vivo
    </span>
  );
}
