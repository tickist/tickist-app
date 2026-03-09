import type { LucideIconData } from 'lucide-angular';
import {
  AlarmClock,
  AppWindow,
  BadgeCheck,
  Bike,
  Bell,
  BookOpen,
  Book,
  Brain,
  Briefcase,
  Bug,
  Building2,
  Bus,
  CalendarDays,
  Camera,
  Car,
  ClipboardList,
  Clock,
  Cloud,
  Coffee,
  Compass,
  CreditCard,
  Database,
  Dumbbell,
  Film,
  Flag,
  FlaskConical,
  Folder,
  FolderOpen,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Hammer,
  Handshake,
  Headphones,
  Heart,
  House,
  Inbox,
  KeyRound,
  Landmark,
  Laptop,
  Leaf,
  Lightbulb,
  ListTodo,
  Lock,
  Map,
  Mic,
  Monitor,
  Moon,
  Music,
  NotebookPen,
  PenTool,
  Paintbrush,
  Palette,
  PartyPopper,
  PawPrint,
  PiggyBank,
  Plane,
  Podcast,
  Receipt,
  Repeat,
  Rocket,
  Sandwich,
  Server,
  Settings,
  Shield,
  ShoppingCart,
  Smartphone,
  Sparkles,
  SquareCheck,
  SquarePen,
  Star,
  Stethoscope,
  Sun,
  Target,
  Telescope,
  Timer,
  TrainFront,
  TreePine,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
  Baby,
} from 'lucide-angular';

export type ProjectIconKey =
  | 'folder'
  | 'folder-open'
  | 'inbox'
  | 'calendar-days'
  | 'lightbulb'
  | 'flag'
  | 'target'
  | 'rocket'
  | 'shield'
  | 'star'
  | 'settings'
  | 'briefcase'
  | 'list-todo'
  | 'square-check'
  | 'square-pen'
  | 'clock'
  | 'heart'
  | 'plane'
  | 'shopping-cart'
  | 'users'
  | 'laptop'
  | 'brain'
  | 'graduation-cap'
  | 'dumbbell'
  | 'tree-pine'
  | 'car'
  | 'camera'
  | 'music'
  | 'gamepad-2'
  | 'wallet'
  | 'badge-check'
  | 'bell'
  | 'sparkles'
  | 'house'
  | 'book'
  | 'repeat'
  | 'clipboard-list'
  | 'globe'
  | 'handshake'
  | 'building-2'
  | 'alarm-clock'
  | 'trophy'
  | 'bug'
  | 'flask-conical'
  | 'stethoscope'
  | 'baby'
  | 'utensils-crossed'
  | 'palette'
  | 'pen-tool'
  | 'hammer'
  | 'wrench'
  | 'database'
  | 'server'
  | 'cloud'
  | 'leaf'
  | 'paw-print'
  | 'gift'
  | 'party-popper'
  | 'film'
  | 'headphones'
  | 'mic'
  | 'book-open'
  | 'notebook-pen'
  | 'receipt'
  | 'piggy-bank'
  | 'credit-card'
  | 'bus'
  | 'bike'
  | 'train-front'
  | 'map'
  | 'compass'
  | 'sun'
  | 'moon'
  | 'key-round'
  | 'lock'
  | 'landmark'
  | 'monitor'
  | 'smartphone'
  | 'telescope'
  | 'app-window'
  | 'paintbrush'
  | 'timer'
  | 'sandwich'
  | 'coffee'
  | 'podcast';

export interface ProjectIconOption {
  key: ProjectIconKey;
  label: string;
}

export const DEFAULT_PROJECT_ICON: ProjectIconKey = 'folder';

export const PROJECT_ICON_OPTIONS: ProjectIconOption[] = [
  { key: 'folder', label: 'Folder' },
  { key: 'folder-open', label: 'Open folder' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'calendar-days', label: 'Calendar' },
  { key: 'lightbulb', label: 'Idea' },
  { key: 'flag', label: 'Flag' },
  { key: 'target', label: 'Target' },
  { key: 'rocket', label: 'Launch' },
  { key: 'shield', label: 'Shield' },
  { key: 'star', label: 'Star' },
  { key: 'settings', label: 'Settings' },
  { key: 'briefcase', label: 'Work' },
  { key: 'list-todo', label: 'Checklist' },
  { key: 'square-check', label: 'Done' },
  { key: 'square-pen', label: 'Writing' },
  { key: 'clock', label: 'Time' },
  { key: 'heart', label: 'Health' },
  { key: 'plane', label: 'Travel' },
  { key: 'shopping-cart', label: 'Shopping' },
  { key: 'users', label: 'Team' },
  { key: 'laptop', label: 'Tech' },
  { key: 'brain', label: 'Learning' },
  { key: 'graduation-cap', label: 'Study' },
  { key: 'dumbbell', label: 'Fitness' },
  { key: 'tree-pine', label: 'Nature' },
  { key: 'car', label: 'Car' },
  { key: 'camera', label: 'Photo' },
  { key: 'music', label: 'Music' },
  { key: 'gamepad-2', label: 'Gaming' },
  { key: 'wallet', label: 'Finance' },
  { key: 'badge-check', label: 'Milestone' },
  { key: 'bell', label: 'Alerts' },
  { key: 'sparkles', label: 'Highlights' },
  { key: 'house', label: 'Home' },
  { key: 'book', label: 'Book' },
  { key: 'repeat', label: 'Routine' },
  { key: 'clipboard-list', label: 'Plan' },
  { key: 'globe', label: 'Global' },
  { key: 'handshake', label: 'Partnership' },
  { key: 'building-2', label: 'Office' },
  { key: 'alarm-clock', label: 'Reminder' },
  { key: 'trophy', label: 'Achievement' },
  { key: 'bug', label: 'Debug' },
  { key: 'flask-conical', label: 'Research' },
  { key: 'stethoscope', label: 'Care' },
  { key: 'baby', label: 'Family' },
  { key: 'utensils-crossed', label: 'Food' },
  { key: 'palette', label: 'Creative' },
  { key: 'pen-tool', label: 'Design' },
  { key: 'hammer', label: 'Build' },
  { key: 'wrench', label: 'Maintenance' },
  { key: 'database', label: 'Data' },
  { key: 'server', label: 'Backend' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'leaf', label: 'Eco' },
  { key: 'paw-print', label: 'Pets' },
  { key: 'gift', label: 'Gifts' },
  { key: 'party-popper', label: 'Events' },
  { key: 'film', label: 'Video' },
  { key: 'headphones', label: 'Audio' },
  { key: 'mic', label: 'Voice' },
  { key: 'book-open', label: 'Reading' },
  { key: 'notebook-pen', label: 'Notes' },
  { key: 'receipt', label: 'Bills' },
  { key: 'piggy-bank', label: 'Savings' },
  { key: 'credit-card', label: 'Payments' },
  { key: 'bus', label: 'Bus' },
  { key: 'bike', label: 'Bike' },
  { key: 'train-front', label: 'Train' },
  { key: 'map', label: 'Map' },
  { key: 'compass', label: 'Direction' },
  { key: 'sun', label: 'Day' },
  { key: 'moon', label: 'Night' },
  { key: 'key-round', label: 'Access' },
  { key: 'lock', label: 'Security' },
  { key: 'landmark', label: 'Legal' },
  { key: 'monitor', label: 'Desktop' },
  { key: 'smartphone', label: 'Mobile' },
  { key: 'telescope', label: 'Vision' },
  { key: 'app-window', label: 'Apps' },
  { key: 'paintbrush', label: 'Art' },
  { key: 'timer', label: 'Focus' },
  { key: 'sandwich', label: 'Meal' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'podcast', label: 'Podcast' },
];

const ICONS_BY_KEY: Record<ProjectIconKey, LucideIconData> = {
  folder: Folder,
  'folder-open': FolderOpen,
  inbox: Inbox,
  'calendar-days': CalendarDays,
  lightbulb: Lightbulb,
  flag: Flag,
  target: Target,
  rocket: Rocket,
  shield: Shield,
  star: Star,
  settings: Settings,
  briefcase: Briefcase,
  'list-todo': ListTodo,
  'square-check': SquareCheck,
  'square-pen': SquarePen,
  clock: Clock,
  heart: Heart,
  plane: Plane,
  'shopping-cart': ShoppingCart,
  users: Users,
  laptop: Laptop,
  brain: Brain,
  'graduation-cap': GraduationCap,
  dumbbell: Dumbbell,
  'tree-pine': TreePine,
  car: Car,
  camera: Camera,
  music: Music,
  'gamepad-2': Gamepad2,
  wallet: Wallet,
  'badge-check': BadgeCheck,
  bell: Bell,
  sparkles: Sparkles,
  house: House,
  book: Book,
  repeat: Repeat,
  'clipboard-list': ClipboardList,
  globe: Globe,
  handshake: Handshake,
  'building-2': Building2,
  'alarm-clock': AlarmClock,
  trophy: Trophy,
  bug: Bug,
  'flask-conical': FlaskConical,
  stethoscope: Stethoscope,
  baby: Baby,
  'utensils-crossed': UtensilsCrossed,
  palette: Palette,
  'pen-tool': PenTool,
  hammer: Hammer,
  wrench: Wrench,
  database: Database,
  server: Server,
  cloud: Cloud,
  leaf: Leaf,
  'paw-print': PawPrint,
  gift: Gift,
  'party-popper': PartyPopper,
  film: Film,
  headphones: Headphones,
  mic: Mic,
  'book-open': BookOpen,
  'notebook-pen': NotebookPen,
  receipt: Receipt,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  bus: Bus,
  bike: Bike,
  'train-front': TrainFront,
  map: Map,
  compass: Compass,
  sun: Sun,
  moon: Moon,
  'key-round': KeyRound,
  lock: Lock,
  landmark: Landmark,
  monitor: Monitor,
  smartphone: Smartphone,
  telescope: Telescope,
  'app-window': AppWindow,
  paintbrush: Paintbrush,
  timer: Timer,
  sandwich: Sandwich,
  coffee: Coffee,
  podcast: Podcast,
};

const ICON_KEYS = new Set<ProjectIconKey>(
  Object.keys(ICONS_BY_KEY) as ProjectIconKey[]
);

export function resolveProjectIconKey(
  raw: string | null | undefined
): ProjectIconKey {
  const normalized = raw?.trim().toLowerCase() ?? '';
  if (ICON_KEYS.has(normalized as ProjectIconKey)) {
    return normalized as ProjectIconKey;
  }
  return DEFAULT_PROJECT_ICON;
}

export function resolveProjectIconData(
  raw: string | null | undefined
): LucideIconData {
  const key = resolveProjectIconKey(raw);
  return ICONS_BY_KEY[key];
}

export function projectIconLabel(raw: string | null | undefined): string {
  const key = resolveProjectIconKey(raw);
  return (
    PROJECT_ICON_OPTIONS.find((option) => option.key === key)?.label ??
    PROJECT_ICON_OPTIONS[0].label
  );
}
