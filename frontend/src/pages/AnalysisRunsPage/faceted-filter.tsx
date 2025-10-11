import { Table } from '@tanstack/react-table'
import { LucideIcon } from 'lucide-react'

import { DataTableFacetedFilter as SharedFilter } from '@/shared/components/DataTableFacetedFilter'

export function DataTableFacetedFilter<TData>({
  columnKey,
  table,
  title,
  options,
}: {
  columnKey: string
  table: Table<TData>
  title: string
  options: { label: string; value: string; icon?: LucideIcon }[]
}) {
  const column = table.getColumn(columnKey)
  if (!column) return null

  return (
    <SharedFilter
      column={column}
      title={title}
      options={options}
    />
  )
}
