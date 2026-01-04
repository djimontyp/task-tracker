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

  test('applies logo-svg class when animated=true', () => {
    renderLogo({ animated: true })
    const svg = screen.getByRole('link').querySelector('svg')
    expect(svg).toHaveClass('logo-svg')
  })

  test('applies pointer-events-none when animated=false', () => {
    renderLogo({ animated: false })
    const svg = screen.getByRole('link').querySelector('svg')
    expect(svg).toHaveClass('pointer-events-none')
  })

  test('uses CSS variables for theming', () => {
    renderLogo()
    const svg = screen.getByRole('link').querySelector('svg')

    // Gradients use CSS variables
    const sweepGradient = svg?.querySelector('#ringGradient')
    expect(sweepGradient).toBeInTheDocument()

    const centerGradient = svg?.querySelector('#coreGradient')
    expect(centerGradient).toBeInTheDocument()
  })

  test('custom className is applied', () => {
    const customClass = 'custom-test-class'
    renderLogo({ className: customClass })
    const link = screen.getByRole('link')
    expect(link).toHaveClass(customClass)
  })

  test('renders all radar elements (rings, core)', () => {
    renderLogo()
    const svg = screen.getByRole('link').querySelector('svg')

    // Rings
    const rings = svg?.querySelectorAll('circle')
    expect(rings?.length).toBeGreaterThanOrEqual(3) // ring + static ring + core

    // Core element
    const core = svg?.querySelector('.logo-core')
    expect(core).toBeInTheDocument()

    // Ring element
    const ring = svg?.querySelector('.logo-ring')
    expect(ring).toBeInTheDocument()
  })

  test('has data-testid for E2E testing', () => {
    renderLogo()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('data-testid', 'sidebar-logo')
  })

  test('displays app name from env or default', () => {
    renderLogo({ showText: true })
    const textElement = screen.getByRole('link').querySelector('span')
    expect(textElement).toBeInTheDocument()
    expect(textElement?.textContent).toBeTruthy()
  })

  test('SVG has aria-hidden for accessibility', () => {
    renderLogo()
    const svg = screen.getByRole('link').querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  test('text has proper whitespace handling', () => {
    renderLogo({ showText: true })
    const textElement = screen.getByRole('link').querySelector('span')
    expect(textElement).toBeInTheDocument()
    expect(textElement).toHaveClass('whitespace-nowrap')
  })

  test('has logo-container class for styling', () => {
    renderLogo()
    const link = screen.getByRole('link')
    expect(link).toHaveClass('logo-container')
  })
})
