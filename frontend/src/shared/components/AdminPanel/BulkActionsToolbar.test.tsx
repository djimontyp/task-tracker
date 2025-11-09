import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BulkActionsToolbar } from './BulkActionsToolbar'

describe('BulkActionsToolbar', () => {
  const defaultProps = {
    selectedCount: 0,
    totalCount: 10,
    onSelectAll: vi.fn(),
    onClearSelection: vi.fn(),
  }

  it('should render with no selection', () => {
    render(<BulkActionsToolbar {...defaultProps} />)

    expect(screen.getByText('Select all')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /archive/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('should show selected count when items selected', () => {
    render(<BulkActionsToolbar {...defaultProps} selectedCount={5} />)

    expect(screen.getByText('5 selected')).toBeInTheDocument()
  })

  it('should show action buttons when items selected', () => {
    render(
      <BulkActionsToolbar
        {...defaultProps}
        selectedCount={5}
        onApprove={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText('5 selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('should call onSelectAll when checkbox clicked', () => {
    const onSelectAll = vi.fn()
    render(<BulkActionsToolbar {...defaultProps} onSelectAll={onSelectAll} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onSelectAll).toHaveBeenCalledTimes(1)
  })

  it('should call onClearSelection when checkbox unchecked', () => {
    const onClearSelection = vi.fn()
    render(
      <BulkActionsToolbar
        {...defaultProps}
        selectedCount={10}
        totalCount={10}
        onClearSelection={onClearSelection}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onClearSelection).toHaveBeenCalledTimes(1)
  })

  it('should have indeterminate state for partial selection', () => {
    render(<BulkActionsToolbar {...defaultProps} selectedCount={5} totalCount={10} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.dataset.state).toBe('indeterminate')
  })

  it('should have checked state when all selected', () => {
    render(<BulkActionsToolbar {...defaultProps} selectedCount={10} totalCount={10} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.dataset.state).toBe('checked')
  })

  it('should call onApprove when approve button clicked', () => {
    const onApprove = vi.fn()
    render(
      <BulkActionsToolbar {...defaultProps} selectedCount={5} onApprove={onApprove} />
    )

    const approveButton = screen.getByRole('button', { name: /approve/i })
    fireEvent.click(approveButton)

    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it('should call onArchive when archive button clicked', () => {
    const onArchive = vi.fn()
    render(
      <BulkActionsToolbar {...defaultProps} selectedCount={5} onArchive={onArchive} />
    )

    const archiveButton = screen.getByRole('button', { name: /archive/i })
    fireEvent.click(archiveButton)

    expect(onArchive).toHaveBeenCalledTimes(1)
  })

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(
      <BulkActionsToolbar {...defaultProps} selectedCount={5} onDelete={onDelete} />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('should call onClearSelection when clear button clicked', () => {
    const onClearSelection = vi.fn()
    render(
      <BulkActionsToolbar
        {...defaultProps}
        selectedCount={5}
        onClearSelection={onClearSelection}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear/i })
    fireEvent.click(clearButton)

    expect(onClearSelection).toHaveBeenCalledTimes(1)
  })

  it('should not render action buttons when callbacks not provided', () => {
    render(<BulkActionsToolbar {...defaultProps} selectedCount={5} />)

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /archive/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <BulkActionsToolbar {...defaultProps} className="custom-class" />
    )

    const toolbar = container.firstChild as HTMLElement
    expect(toolbar.className).toContain('custom-class')
  })

  it('should have proper accessibility attributes', () => {
    render(<BulkActionsToolbar {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('id', 'select-all')

    const label = screen.getByLabelText('Select all')
    expect(label).toBeInTheDocument()
  })
})
