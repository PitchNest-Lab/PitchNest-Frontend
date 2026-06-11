export function YCBatchBar() {
  return (
    <div className="yc-batch-bar fixed top-16 left-0 right-0 z-40">
      <div className="flex h-11 items-center justify-center gap-2.5 px-4">
        <div
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] bg-[#F26522]"
          aria-hidden
        >
          <span className="text-[13px] font-bold leading-none text-white">Y</span>
        </div>
        <p className="text-[13px] sm:text-sm leading-none text-white">
          <span className="font-normal text-white/75">Applying to </span>
          <span className="font-semibold text-white">Y Combinator</span>
          <span className="mx-1.5 font-medium text-white/50">·</span>
          <span className="font-semibold text-white">Winter 2026 Batch</span>
        </p>
      </div>
    </div>
  );
}
