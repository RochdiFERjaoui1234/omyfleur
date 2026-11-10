export function MorphBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="morph-blob absolute -top-[20%] -right-[20%] h-[80vmax] w-[80vmax] rounded-full bg-gold opacity-15 blur-[80px] [animation:blob-drift_22s_ease-in-out_infinite]" />
      <div className="morph-blob absolute -bottom-[20%] -left-[20%] h-[80vmax] w-[80vmax] rounded-full bg-surface opacity-80 blur-[80px] [animation:blob-drift-alt_26s_ease-in-out_infinite]" />
    </div>
  );
}
