/**
 * @tymblok/ui
 * Shared UI components for Tymblok mobile and desktop applications
 */

// Context
export { ThemeProvider, useTheme, useThemeColors } from './context';

// Primitive components
export {
  Button,
  Input,
  Card,
  Badge,
  Toggle,
  Avatar,
  Skeleton,
  SkeletonText,
  SkeletonCard,
} from './components/primitives';
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  InputProps,
  InputType,
  CardProps,
  CardVariant,
  CardPadding,
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  ToggleProps,
  AvatarProps,
  AvatarSize,
  SkeletonProps,
  SkeletonVariant,
} from './components/primitives';

// Navigation components
export { BottomNav, Header, CollapsibleHeader, BackButton } from './components/navigation';
export type {
  BottomNavProps,
  TabItem,
  TabKey,
  HeaderProps,
  CollapsibleHeaderProps,
  BackButtonProps,
} from './components/navigation';

// Feedback components
export {
  EmptyState,
  InboxEmptyState,
  TasksEmptyState,
  SearchEmptyState,
  LoadingScreen,
  LoadingSpinner,
  Toast,
} from './components/feedback';
export type { EmptyStateProps, LoadingScreenProps, ToastData } from './components/feedback';

// Composite components
export {
  TaskCard,
  InboxItem,
  StatCard,
  StreakCard,
  FocusScoreCard,
  CategoryBreakdown,
  SettingsRow,
  SettingsSection,
  SettingsGroup,
  IntegrationCard,
  ApiKeyCard,
} from './components/composite';
export type {
  TaskCardProps,
  TaskCardData,
  TaskType,
  TimerStatus,
  InboxItemProps,
  InboxItemData,
  InboxSource,
  InboxItemType,
  InboxPriority,
  StatCardProps,
  StreakCardProps,
  FocusScoreCardProps,
  CategoryBreakdownProps,
  SettingsRowProps,
  SettingsRowVariant,
  IntegrationCardProps,
  IntegrationType,
  ApiKeyCardProps,
} from './components/composite';

// Modal components
export { BottomSheet, AddTaskModal, TaskDetailModal } from './components/modals';
export type {
  BottomSheetProps,
  AddTaskModalProps,
  TaskDetailModalProps,
  TaskCategory,
  ApiCategory,
} from './components/modals';

// Screens
export { OnboardingScreen, LoginScreen, SignUpScreen, ForgotPasswordScreen } from './screens';
export type {
  OnboardingScreenProps,
  LoginScreenProps,
  SignUpScreenProps,
  ForgotPasswordScreenProps,
} from './screens';

// Hooks
export {
  usePressAnimation,
  useFloatAnimation,
  usePulseAnimation,
  useShakeAnimation,
  useFadeAnimation,
  useSlideAnimation,
} from './hooks';
