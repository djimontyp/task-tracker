/**
 * Composition Patterns
 *
 * Pre-built UI patterns for common use cases.
 * These patterns combine design tokens with component composition.
 *
 * @example
 * import { CardWithStatus, ListItemWithAvatar, FormField } from '@/shared/patterns';
 *
 * @see Storybook: "Design System / Patterns"
 */

// Card patterns
export {
  CardWithStatus,
  StatusBadge,
  StatusDot,
  type CardWithStatusProps,
  type StatusType,
  type StatusBadgeProps,
  type StatusDotProps,
} from './CardWithStatus';

// List patterns
export {
  ListItemWithAvatar,
  CompactListItem,
  ListItemWithBadge,
  ListContainer,
  type ListItemWithAvatarProps,
  type CompactListItemProps,
  type ListItemWithBadgeProps,
  type ListContainerProps,
  type AvatarConfig,
  type AvatarSize,
} from './ListItemWithAvatar';

// Form patterns
export {
  FormField,
  InlineFormField,
  FormSection,
  FormActions,
  Fieldset,
  type FormFieldProps,
  type InlineFormFieldProps,
  type FormSectionProps,
  type FormActionsProps,
  type FieldsetProps,
} from './FormField';

// Empty state patterns
export {
  EmptyState,
  IllustratedEmptyState,
  LoadingEmptyState,
  type EmptyStateProps,
  type EmptyStateVariant,
  type IllustratedEmptyStateProps,
  type LoadingEmptyStateProps,
} from './EmptyState';
