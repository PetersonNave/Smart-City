import { House, MapPin, ClipboardList, User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme';

const ICONS = {
  home: House,
  map: MapPin,
  demands: ClipboardList,
  profile: User,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
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
  const LucideComponent = ICONS[name];
  return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} testID={testID} />;
}
