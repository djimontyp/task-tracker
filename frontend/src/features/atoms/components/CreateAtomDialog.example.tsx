import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { CreateAtomDialog } from './CreateAtomDialog'
import type { Atom } from '../types'

export function CreateAtomDialogExample() {
  const [isOpen, setIsOpen] = useState(false)
  const topicId = 1

  const handleAtomCreated = (atom: Atom) => {
    console.log('New atom created:', atom)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Створити атом</Button>

      <CreateAtomDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        topicId={topicId}
        onAtomCreated={handleAtomCreated}
      />
    </>
  )
}
