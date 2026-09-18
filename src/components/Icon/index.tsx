import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { LucideIconNode } from 'lucide-react-native';
import { colors } from '../../theme';

const ICONS = {
  home: [
    ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', key: '5wwlr5' }],
    [
      'path',
      {
        d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
        key: 'r6nss1',
      },
    ],
  ],
  map: [
    [
      'path',
      {
        d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
        key: '1r0f0z',
      },
    ],
    ['circle', { cx: '12', cy: '10', r: '3', key: 'ilqhr7' }],
  ],
  demands: [
    ['rect', { width: '8', height: '4', x: '8', y: '2', rx: '1', ry: '1', key: 'tgr4d6' }],
    ['path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', key: '116196' }],
    ['path', { d: 'M12 11h4', key: '1jrz19' }],
    ['path', { d: 'M12 16h4', key: 'n85exb' }],
    ['path', { d: 'M8 11h.01', key: '1dfujw' }],
    ['path', { d: 'M8 16h.01', key: '18s6g9' }],
  ],
  profile: [
    ['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', key: '975kel' }],
    ['circle', { cx: '12', cy: '7', r: '4', key: '17ys0d' }],
  ],
  mail: [
    ['path', { d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7', key: '132q7q' }],
    ['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2', key: 'izxlao' }],
  ],
  lock: [
    ['rect', { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2', key: '1w4ew1' }],
    ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4', key: 'fwvmzm' }],
  ],
  eye: [
    ['path', { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0', key: '1nclc0' }],
    ['circle', { cx: '12', cy: '12', r: '3', key: '1v7zrd' }],
  ],
  eyeOff: [
    ['path', { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49', key: 'ct8e1f' }],
    ['path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242', key: '151rxh' }],
    ['path', { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143', key: '13bj9a' }],
    ['path', { d: 'm2 2 20 20', key: '1ooewy' }],
  ],
};

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
};

export function Icon({ name, size = 24, color = colors.navy, strokeWidth = 2, testID }: IconProps) {
  const nodes = ICONS[name] as LucideIconNode[];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      testID={testID}
    >
      {nodes.map(([tag, attributes]) => {
        const Component = tag === 'circle' ? Circle : tag === 'rect' ? Rect : Path;
        return <Component {...attributes} key={attributes.key} />;
      })}
    </Svg>
  );
}
