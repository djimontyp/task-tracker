/**
 * Layout Primitives
 *
 * Type-safe, constrained layout components for consistent UI.
 * Inspired by Atlassian Design System, Twilio Paste, and Chakra UI.
 *
 * @example
 * import { Box, Stack, Inline, Center, PageWrapper } from '@/shared/primitives';
 *
 * // Page layout
 * <PageWrapper variant="fullWidth">
 *   <Stack gap="lg">
 *     <Inline gap="sm" align="center">
 *       <Icon />
 *       <Text>Title</Text>
 *     </Inline>
 *     <Box padding="md" background="muted" rounded="lg">
 *       Content here
 *     </Box>
 *   </Stack>
 * </PageWrapper>
 *
 * @see docs/design-system/04-layout-primitives.md
 */

// Foundational primitive
export { Box, type BoxProps, type SpacingToken, type BackgroundToken, type RoundedToken, type BoxElement } from './Box';

// Layout primitives
export { Stack, type StackProps, type AlignToken as StackAlignToken } from './Stack';
export { Inline, type InlineProps, type AlignToken as InlineAlignToken, type JustifyToken } from './Inline';
export { Center, type CenterProps, type MaxWidthToken } from './Center';

// Page-level primitive
export { PageWrapper, type PageWrapperProps, type PageVariant, pageVariantStyles } from './PageWrapper';
