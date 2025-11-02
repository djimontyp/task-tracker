/**
 * Demo component to verify useAdminMode hook functionality
 * Can be used for manual browser testing
 * Import in any page temporarily to test
 */

import { useAdminMode } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

export const AdminModeDemo = () => {
  const { isAdminMode, toggleAdminMode, enableAdminMode, disableAdminMode } = useAdminMode()

  return (
    <Card className="p-6 max-w-md">
      <h2 className="text-xl font-bold mb-4">Admin Mode Hook Demo</h2>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Current State:</p>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isAdminMode ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <span className="font-medium">
            {isAdminMode ? 'Admin Mode ENABLED' : 'Admin Mode DISABLED'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={toggleAdminMode} variant="default" size="sm">
          Toggle Admin Mode
        </Button>
        <Button onClick={enableAdminMode} variant="outline" size="sm" disabled={isAdminMode}>
          Enable Admin Mode
        </Button>
        <Button onClick={disableAdminMode} variant="outline" size="sm" disabled={!isAdminMode}>
          Disable Admin Mode
        </Button>
      </div>

      <div className="mt-4 p-3 bg-muted rounded text-xs">
        <p className="font-medium mb-1">Test persistence:</p>
        <p>1. Toggle the mode</p>
        <p>2. Refresh the page</p>
        <p>3. State should persist</p>
      </div>
    </Card>
  )
}
