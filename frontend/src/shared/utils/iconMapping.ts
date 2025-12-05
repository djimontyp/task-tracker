import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsRight,
  ChevronsUpDown,
  Clipboard,
  ClipboardList,
  Clock,
  CloudUpload,
  Cpu,
  Database,
  FileDown,
  FileText,
  Filter,
  Flame,
  Folder,
  Home,
  Inbox,
  Info,
  LayoutGrid,
  Lightbulb,
  List,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Paintbrush,
  Pencil,
  Plus,
  PlusCircle,
  Rocket,
  RotateCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Signal,
  SignalZero,
  Sparkles,
  Tag,
  TestTube2,
  Trash2,
  TrendingUp,
  User,
  Users,
  Wifi,
  X,
  XCircle,
} from 'lucide-react';

/**
 * Mapping from Heroicons names to Lucide React components
 * Supports both 'FolderIcon' and 'Folder' formats
 */
const iconMapping: Record<string, LucideIcon> = {
  // With 'Icon' suffix
  ArrowDownIcon: ArrowDown,
  ArrowLeftIcon: ArrowLeft,
  ArrowPathIcon: RotateCw,
  ArrowRightIcon: ArrowRight,
  ArrowRightOnRectangleIcon: LogOut,
  ArrowTrendingUpIcon: TrendingUp,
  ArrowUpIcon: ArrowUp,
  BeakerIcon: TestTube2,
  BellIcon: Bell,
  ChatBubbleLeftIcon: MessageCircle,
  ChatBubbleLeftRightIcon: MessageSquare,
  CheckBadgeIcon: BadgeCheck,
  CheckCircleIcon: CheckCircle,
  CheckIcon: Check,
  ChartBarIcon: BarChart3,
  ChevronDoubleRightIcon: ChevronsRight,
  ChevronDownIcon: ChevronDown,
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  ChevronUpDownIcon: ChevronsUpDown,
  ChevronUpIcon: ChevronUp,
  CircleStackIcon: Database,
  ClipboardDocumentIcon: Clipboard,
  ClipboardDocumentListIcon: ClipboardList,
  ClockIcon: Clock,
  CloudArrowUpIcon: CloudUpload,
  Cog6ToothIcon: Settings,
  CpuChipIcon: Cpu,
  DocumentArrowDownIcon: FileDown,
  DocumentTextIcon: FileText,
  EllipsisHorizontalIcon: MoreHorizontal,
  EllipsisVerticalIcon: MoreVertical,
  EnvelopeIcon: Mail,
  ExclamationCircleIcon: AlertCircle,
  ExclamationTriangleIcon: AlertTriangle,
  FireIcon: Flame,
  FolderIcon: Folder,
  FunnelIcon: Filter,
  HomeIcon: Home,
  InboxIcon: Inbox,
  InformationCircleIcon: Info,
  LightBulbIcon: Lightbulb,
  ListBulletIcon: List,
  MagnifyingGlassIcon: Search,
  MinusIcon: Minus,
  PaintBrushIcon: Paintbrush,
  PencilIcon: Pencil,
  PlusCircleIcon: PlusCircle,
  PlusIcon: Plus,
  RocketLaunchIcon: Rocket,
  ServerIcon: Server,
  ShieldCheckIcon: ShieldCheck,
  SignalIcon: Signal,
  SignalSlashIcon: SignalZero,
  SparklesIcon: Sparkles,
  Squares2X2Icon: LayoutGrid,
  TagIcon: Tag,
  TrashIcon: Trash2,
  UserGroupIcon: Users,
  UserIcon: User,
  WifiIcon: Wifi,
  XCircleIcon: XCircle,
  XMarkIcon: X,

  // Without 'Icon' suffix (for convenience)
  ArrowDown,
  ArrowLeft,
  ArrowPath: RotateCw,
  ArrowRight,
  ArrowRightOnRectangle: LogOut,
  ArrowTrendingUp: TrendingUp,
  ArrowUp,
  Beaker: TestTube2,
  Bell,
  ChatBubbleLeft: MessageCircle,
  ChatBubbleLeftRight: MessageSquare,
  CheckBadge: BadgeCheck,
  CheckCircle,
  Check,
  ChartBar: BarChart3,
  ChevronDoubleRight: ChevronsRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUpDown: ChevronsUpDown,
  ChevronUp,
  CircleStack: Database,
  ClipboardDocument: Clipboard,
  ClipboardDocumentList: ClipboardList,
  Clock,
  CloudArrowUp: CloudUpload,
  Cog6Tooth: Settings,
  CpuChip: Cpu,
  DocumentArrowDown: FileDown,
  DocumentText: FileText,
  EllipsisHorizontal: MoreHorizontal,
  EllipsisVertical: MoreVertical,
  Envelope: Mail,
  ExclamationCircle: AlertCircle,
  ExclamationTriangle: AlertTriangle,
  Fire: Flame,
  Folder,
  Funnel: Filter,
  Home,
  Inbox,
  InformationCircle: Info,
  LightBulb: Lightbulb,
  ListBullet: List,
  MagnifyingGlass: Search,
  Minus,
  PaintBrush: Paintbrush,
  Pencil,
  PlusCircle,
  Plus,
  RocketLaunch: Rocket,
  Server,
  ShieldCheck,
  Signal,
  SignalSlash: SignalZero,
  Sparkles,
  Squares2X2: LayoutGrid,
  Tag,
  Trash: Trash2,
  UserGroup: Users,
  User,
  Wifi,
  XCircle,
  XMark: X,
};

/**
 * Get Lucide icon component by name
 * Supports both Heroicons format ('FolderIcon') and short format ('Folder')
 *
 * @param name - Icon name (e.g., 'FolderIcon', 'Folder')
 * @returns Lucide icon component (falls back to Folder if not found)
 *
 * @example
 * ```tsx
 * const Icon = getIconByName('FolderIcon');
 * return <Icon className="h-5 w-5" />;
 * ```
 */
export function getIconByName(name: string): LucideIcon {
  return iconMapping[name] || Folder;
}

/**
 * Check if icon name exists in mapping
 *
 * @param name - Icon name to check
 * @returns true if icon exists in mapping
 */
export function hasIcon(name: string): boolean {
  return name in iconMapping;
}

/**
 * Get all available icon names
 *
 * @returns Array of all icon names in mapping
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(iconMapping);
}

export type { LucideIcon };
