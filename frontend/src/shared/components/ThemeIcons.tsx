interface ThemeIconProps {
  theme: 'light' | 'dark' | 'system'
  className?: string
}

export const UniversalThemeIcon = ({ theme, className = 'size-5' }: ThemeIconProps) => {
  if (theme === 'light') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${className} text-blue-500 dark:text-blue-400 transition-all duration-300`}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  if (theme === 'dark') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={`${className} fill-zinc-800 dark:fill-zinc-200 transition-all duration-300`}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  // System theme - half-filled circle
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={`${className} transition-all duration-300`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="half-circle-clip">
          <rect x="12" y="3" width="9" height="18" />
        </clipPath>
      </defs>

      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-indigo-500 dark:text-indigo-400"
      />

      <circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
        className="text-indigo-200 dark:text-indigo-300"
        clipPath="url(#half-circle-clip)"
      />
    </svg>
  )
}
