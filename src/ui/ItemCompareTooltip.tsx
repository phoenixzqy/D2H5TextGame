/**
 * ItemCompareTooltip — thin wrapper that delegates to `<StatSheet>` in
 * compare mode. Kept for backwards-compatibility (other call sites still
 * import it). New layout: per-row `current | candidate (±Δ)` with inline,
 * color-coded delta. See `StatSheet.tsx`.
 */
import type { CompareResult } from '@/features/inventory/compareEquip';
import { StatSheet } from './StatSheet';

interface Props {
  readonly compare: CompareResult;
  readonly className?: string;
}

export function ItemCompareTooltip({ compare, className }: Props): JSX.Element {
  return (
    <StatSheet
      mode="compare"
      current={compare.current}
      candidate={compare.candidate}
      stats={compare.stats}
      resistances={compare.resistances}
      {...(className !== undefined ? { className } : {})}
    />
  );
}
