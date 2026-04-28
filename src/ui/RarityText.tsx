/**
 * Rarity-colored text component
 */

import type { Rarity } from '@/engine/types/items';

interface RarityTextProps {
  rarity: Rarity;
  children: React.ReactNode;
  className?: string;
}

export function RarityText({ rarity, children, className = '' }: RarityTextProps) {
  const colorClasses = {
    normal: 'text-d2-white',
    magic: 'text-d2-magic',
    rare: 'text-d2-rare',
    unique: 'text-d2-unique',
    set: 'text-d2-set',
    runeword: 'text-d2-runeword'
  };

  return <span className={`${colorClasses[rarity]} ${className}`}>{children}</span>;
}
