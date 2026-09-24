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
  chevronLeft: [['path', { d: 'm15 18-6-6 6-6', key: '1wnfg3' }]],
  chevronDown: [['path', { d: 'm6 9 6 6 6-6', key: 'qrunsl' }]],
  trash: [
    ['path', { d: 'M10 11v6', key: 'nco0om' }],
    ['path', { d: 'M14 11v6', key: 'outv1u' }],
    ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', key: 'miytrc' }],
    ['path', { d: 'M3 6h18', key: 'd0wm0j' }],
    ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', key: 'e791ji' }],
  ],
  pencil: [
    [
      'path',
      {
        d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
        key: '1a8usu',
      },
    ],
    ['path', { d: 'm15 5 4 4', key: '1mk7zo' }],
  ],
  camera: [
    [
      'path',
      {
        d: 'M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z',
        key: '18u6gg',
      },
    ],
    ['circle', { cx: '12', cy: '13', r: '3', key: '1vg3eu' }],
  ],
  plus: [
    ['path', { d: 'M5 12h14', key: '1ays0h' }],
    ['path', { d: 'M12 5v14', key: 's699le' }],
  ],
  check: [['path', { d: 'M20 6 9 17l-5-5', key: '1gmf2c' }]],
  rotateCw: [
    ['path', { d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', key: '1p45f6' }],
    ['path', { d: 'M21 3v5h-5', key: '1q7to0' }],
  ],
  close: [
    ['path', { d: 'M18 6 6 18', key: '1bl5f8' }],
    ['path', { d: 'm6 6 12 12', key: 'd8bk6v' }],
  ],
  alert: [
    ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', key: 'wmoenq' }],
    ['path', { d: 'M12 9v4', key: 'juzpu7' }],
    ['path', { d: 'M12 17h.01', key: 'p32p05' }],
  ],
  // Ícones de categoria de demanda (miniatura dos cards, já que a API não guarda foto).
  construction: [
    ['rect', { x: '2', y: '6', width: '20', height: '8', rx: '1', key: '1estib' }],
    ['path', { d: 'M17 14v7', key: '7m2elx' }],
    ['path', { d: 'M7 14v7', key: '1cm7wv' }],
    ['path', { d: 'M17 3v3', key: '1v4jwn' }],
    ['path', { d: 'M7 3v3', key: '7o6guu' }],
    ['path', { d: 'M10 14 2.3 6.3', key: '1023jk' }],
    ['path', { d: 'm14 6 7.7 7.7', key: '1s8pl2' }],
    ['path', { d: 'm8 6 8 8', key: 'hl96qh' }],
  ],
  lightbulb: [
    [
      'path',
      {
        d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
        key: '1gvzjb',
      },
    ],
    ['path', { d: 'M9 18h6', key: 'x1upvd' }],
    ['path', { d: 'M10 22h4', key: 'ceow96' }],
  ],
  droplets: [
    [
      'path',
      {
        d: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z',
        key: '1ptgy4',
      },
    ],
    [
      'path',
      {
        d: 'M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97',
        key: '1sl1rz',
      },
    ],
  ],
  search: [
    ['path', { d: 'm21 21-4.34-4.34', key: '14j7rj' }],
    ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
  ],
  help: [
    ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
    ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', key: '1u773s' }],
    ['path', { d: 'M12 17h.01', key: 'p32p05' }],
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
