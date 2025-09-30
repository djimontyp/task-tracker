import React from 'react'
import { useWebSocket } from '@features/websocket/hooks/useWebSocket'

const Header = () => {
  const { isConnected } = useWebSocket()

  return (
    <header className="bg-white shadow-sm border-b px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">Welcome back!</h2>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              aria-label={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-sm text-gray-600 hidden md:inline">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header