import { Table } from '@tanstack/react-table'
import React from 'react'

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
  options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
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
