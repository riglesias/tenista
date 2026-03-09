"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestDialogPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Dialog Page</h1>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>
              This is a simple test dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-name">Name</Label>
              <Input
                id="test-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name"
              />
            </div>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
