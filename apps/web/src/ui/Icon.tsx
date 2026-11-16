import { ICONS, type IconName, type IconShape } from './icons.generated';

export type { IconName };

function Shape({ shape }: { shape: IconShape }) {
  switch (shape.tag) {
    case 'path':
      return <path d={shape.d} fill={shape.fill} stroke={shape.stroke} strokeDasharray={shape.strokeDasharray} />;
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} stroke={shape.stroke} />;
    case 'rect':
      return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} ry={shape.ry} />;
    case 'line':
      return <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} />;
  }
}

interface Props {
  name: IconName;
  /** `lg`: 24 px, for a notice. Default: 1.25 em, next to a word. */
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * A line icon of the design system: 24 px grid, round ends, no fill, 1.5 px stroke on screen
 * (set by `.co-ic`). It goes with a word and never replaces it, so it is hidden from assistive
 * technology: an icon on its own needs its name next to it as hidden text or `aria-label`.
 */
export function Icon({ name, size = 'md', className = '' }: Props) {
  const shapes: readonly IconShape[] = ICONS[name];
  return (
    <svg
      className={`co-ic${size === 'lg' ? ' co-ic--lg' : ''}${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {shapes.map((shape, index) => (
        <Shape key={index} shape={shape} />
      ))}
    </svg>
  );
}
