/**
 * Test suite for AdminPanel component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { AdminPanel } from './AdminPanel'

describe('AdminPanel', () => {
  it('should not render when visible is false', () => {
    render(
      <AdminPanel visible={false}>
        <div>Content</div>
      </AdminPanel>
    )

    expect(screen.queryByRole('region', { name: 'Admin Panel' })).not.toBeInTheDocument()
  })

  it('should render when visible is true', () => {
    render(
      <AdminPanel visible={true}>
        <div>Admin Content</div>
      </AdminPanel>
    )

    expect(screen.getByRole('region', { name: 'Admin Panel' })).toBeInTheDocument()
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should toggle expand/collapse on button click', () => {
    render(
      <AdminPanel visible={true}>
        <div>Content</div>
      </AdminPanel>
    )

    const toggleButton = screen.getByRole('button', { name: /Admin Panel/i })

    // Initially expanded
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Click to collapse
    fireEvent.click(toggleButton)
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Click to expand again
    fireEvent.click(toggleButton)
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('should have proper ARIA attributes', () => {
    render(
      <AdminPanel visible={true}>
        <div>Content</div>
      </AdminPanel>
    )

    const toggleButton = screen.getByRole('button', { name: /Admin Panel/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    expect(toggleButton).toHaveAttribute('aria-controls', 'admin-panel-content')

    const panelRegion = screen.getByRole('region', { name: 'Admin Panel' })
    expect(panelRegion).toBeInTheDocument()
  })

  it('should display keyboard shortcut hint', () => {
    render(
      <AdminPanel visible={true}>
        <div>Content</div>
      </AdminPanel>
    )

    expect(screen.getByText(/Cmd\+Shift\+A to toggle/i)).toBeInTheDocument()
  })

  it('should call onToggle callback when clicked', () => {
    const onToggle = vi.fn()

    render(
      <AdminPanel visible={true} onToggle={onToggle}>
        <div>Content</div>
      </AdminPanel>
    )

    const toggleButton = screen.getByRole('button', { name: /Admin Panel/i })

    fireEvent.click(toggleButton)
    expect(onToggle).toHaveBeenCalledTimes(1)

    fireEvent.click(toggleButton)
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  it('should have correct styling classes', () => {
    render(
      <AdminPanel visible={true}>
        <div>Content</div>
      </AdminPanel>
    )

    const panel = screen.getByRole('region', { name: 'Admin Panel' })
    expect(panel).toHaveClass('bg-semantic-warning/10')
    expect(panel).toHaveClass('border-t')
    expect(panel).toHaveClass('transition-all')
  })

  it('should render children correctly', () => {
    render(
      <AdminPanel visible={true}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AdminPanel>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('should show chevron icons correctly', () => {
    render(
      <AdminPanel visible={true}>
        <div>Content</div>
      </AdminPanel>
    )

    const toggleButton = screen.getByRole('button', { name: /Admin Panel/i })

    // Initially expanded - ChevronUp icon
    let icon = toggleButton.querySelector('svg')
    expect(icon).toBeInTheDocument()

    // Click to collapse - ChevronDown icon should appear
    fireEvent.click(toggleButton)
    icon = toggleButton.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should maintain expanded state across re-renders', () => {
    const { rerender } = render(
      <AdminPanel visible={true}>
        <div>Original Content</div>
      </AdminPanel>
    )

    const toggleButton = screen.getByRole('button', { name: /Admin Panel/i })

    // Collapse
    fireEvent.click(toggleButton)
    expect(screen.queryByText('Original Content')).not.toBeInTheDocument()

    // Re-render with new children
    rerender(
      <AdminPanel visible={true}>
        <div>New Content</div>
      </AdminPanel>
    )

    // Should still be collapsed
    expect(screen.queryByText('New Content')).not.toBeInTheDocument()
  })
})
