import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Logo } from './Logo'

/**
 * Render Logo with MemoryRouter wrapper
 */
const renderLogo = (props = {}) => {
  return render(
    <MemoryRouter>
      <Logo {...props} />
    </MemoryRouter>
  )
}

describe('Logo Component', () => {
  test('renders radar SVG icon', () => {
    renderLogo()
    const svg = screen.getByRole('link').querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 32 32')
  })

  test('shows text when showText=true', () => {
    renderLogo({ showText: true })
    expect(screen.getByText(/pulse radar/i)).toBeInTheDocument()
  })

  test('hides text when collapsed=true', () => {
    renderLogo({ showText: true, collapsed: true })
    expect(screen.queryByText(/pulse radar/i)).not.toBeInTheDocument()
  })

  test('shows text when collapsed=false', () => {
    renderLogo({ showText: true, collapsed: false })
    expect(screen.getByText(/pulse radar/i)).toBeInTheDocument()
  })

  test('applies correct size class for sm', () => {
    renderLogo({ size: 'sm' })
    const container = screen.getByRole('link').querySelector('div')
    expect(container).toHaveClass('h-8', 'w-8')
  })

  test('applies correct size class for md', () => {
    renderLogo({ size: 'md' })
    const container = screen.getByRole('link').querySelector('div')
    expect(container).toHaveClass('h-10', 'w-10')
  })

  test('applies correct size class for lg', () => {
    renderLogo({ size: 'lg' })
    const container = screen.getByRole('link').querySelector('div')
    expect(container).toHaveClass('h-12', 'w-12')
  })

  test('links to home page (/)', () => {
    renderLogo()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/')
  })

  test('has accessible aria-label', () => {
    renderLogo()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-label')
    expect(link.getAttribute('aria-label')).toContain('home')
  })

  test('applies animation class when animated=true', () => {
    renderLogo({ animated: true })
    const svg = screen.getByRole('link').querySelector('svg')
    expect(svg).toHaveClass('hover:[&_line]:animate-spin-slow')
  })

  test('does not apply animation class when animated=false', () => {
    renderLogo({ animated: false })
    const svg = screen.getByRole('link').querySelector('svg')
    expect(svg).not.toHaveClass('hover:[&_line]:animate-spin-slow')
  })

  test('gradient includes blue and purple colors', () => {
    renderLogo()
    const svg = screen.getByRole('link').querySelector('svg')
    const gradient = svg?.querySelector('linearGradient')

    expect(gradient).toBeInTheDocument()
    expect(gradient).toHaveAttribute('id', 'pulseGradient')

    const stops = gradient?.querySelectorAll('stop')
    expect(stops).toHaveLength(2)
    expect(stops?.[0]).toHaveStyle({ stopColor: '#3b82f6' }) // Blue
    expect(stops?.[1]).toHaveStyle({ stopColor: '#8b5cf6' }) // Purple
  })

  test('custom className is applied', () => {
    const customClass = 'custom-test-class'
    renderLogo({ className: customClass })
    const link = screen.getByRole('link')
    expect(link).toHaveClass(customClass)
  })

  test('renders all radar elements (circles, line, dots)', () => {
    renderLogo()
    const svg = screen.getByRole('link').querySelector('svg')

    // 3 concentric circles (radar rings)
    const circles = svg?.querySelectorAll('circle[stroke="url(#pulseGradient)"]')
    expect(circles).toHaveLength(4) // 3 radar rings + 1 center pulse

    // Radar sweep line
    const line = svg?.querySelector('line')
    expect(line).toBeInTheDocument()
    expect(line).toHaveAttribute('stroke', 'url(#pulseGradient)')

    // Task dots (3 dots representing tracked items)
    const dots = svg?.querySelectorAll('circle[fill="#3b82f6"], circle[fill="#8b5cf6"]')
    expect(dots?.length).toBeGreaterThanOrEqual(3)
  })

  test('has data-testid for E2E testing', () => {
    renderLogo()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('data-testid', 'sidebar-logo')
  })

  test('uses VITE_APP_NAME env variable when available', () => {
    // Mock env variable
    const originalEnv = import.meta.env.VITE_APP_NAME
    import.meta.env.VITE_APP_NAME = 'Test App'

    renderLogo({ showText: true })
    expect(screen.getByText('Test App')).toBeInTheDocument()

    // Restore
    import.meta.env.VITE_APP_NAME = originalEnv
  })

  test('falls back to "Pulse Radar" when VITE_APP_NAME not set', () => {
    // Mock empty env variable
    const originalEnv = import.meta.env.VITE_APP_NAME
    import.meta.env.VITE_APP_NAME = undefined

    renderLogo({ showText: true })
    expect(screen.getByText(/pulse radar/i)).toBeInTheDocument()

    // Restore
    import.meta.env.VITE_APP_NAME = originalEnv
  })

  test('SVG has aria-hidden for accessibility', () => {
    renderLogo()
    const svg = screen.getByRole('link').querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  test('text has proper whitespace handling', () => {
    renderLogo({ showText: true })
    const text = screen.getByText(/pulse radar/i)
    expect(text).toHaveClass('whitespace-nowrap')
  })
})
