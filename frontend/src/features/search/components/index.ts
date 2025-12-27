// SearchBar and search items moved to @/shared/components/SearchBar (presentational)
// SearchContainer is the "smart" wrapper with API calls and state management
export { SearchContainer } from './SearchContainer'
export type { SearchContainerProps } from './SearchContainer'
export { MessageSearchCard } from './MessageSearchCard'
export { TopicSearchCard } from './TopicSearchCard'

// Re-export from shared for backwards compatibility
export { SearchDropdown } from '@/shared/components/SearchBar/SearchDropdown'
export { MessageSearchItem } from '@/shared/components/SearchBar/MessageSearchItem'
export { AtomSearchItem } from '@/shared/components/SearchBar/AtomSearchItem'
export { TopicSearchItem } from '@/shared/components/SearchBar/TopicSearchItem'
