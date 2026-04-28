/**
 * Stat bar (HP/MP/XP progress bars)
 */

interface StatBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'hp' | 'mp' | 'xp' | 'gold';
  showValues?: boolean;
  className?: string;
}

export function StatBar({
  current,
  max,
  label,
  color = 'hp',
  showValues = true,
  className = ''
}: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  const colorClasses = {
    hp: 'bg-red-600',
    mp: 'bg-blue-600',
    xp: 'bg-d2-gold',
    gold: 'bg-d2-unique'
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-d2-white mb-1">
          <span className="font-bold">{label}</span>
          {showValues && (
            <span>
              {Math.floor(current)} / {Math.floor(max)}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-4 bg-d2-bg border border-d2-border rounded overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${String(percentage)}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
