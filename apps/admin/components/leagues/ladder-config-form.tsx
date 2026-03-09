"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LadderConfig, DEFAULT_LADDER_CONFIG } from "@/types/database.types"
import { Info } from "lucide-react"

interface LadderConfigFormProps {
  config: LadderConfig
  onChange: (config: LadderConfig) => void
}

export function LadderConfigForm({ config, onChange }: LadderConfigFormProps) {
  const handleChange = (field: keyof LadderConfig, value: number) => {
    onChange({
      ...config,
      [field]: value,
    })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Info className="h-4 w-4 text-blue-500" />
        Ladder Rules Configuration
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_challenge_positions">
            Max Challenge Positions
          </Label>
          <Input
            id="max_challenge_positions"
            type="number"
            min={1}
            max={10}
            value={config.max_challenge_positions}
            onChange={(e) => handleChange('max_challenge_positions', parseInt(e.target.value) || DEFAULT_LADDER_CONFIG.max_challenge_positions)}
          />
          <p className="text-xs text-muted-foreground">
            How many positions up a player can challenge (e.g., 4 means position 8 can challenge positions 4-7)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_active_outgoing_challenges">
            Max Active Challenges
          </Label>
          <Input
            id="max_active_outgoing_challenges"
            type="number"
            min={1}
            max={5}
            value={config.max_active_outgoing_challenges}
            onChange={(e) => handleChange('max_active_outgoing_challenges', parseInt(e.target.value) || DEFAULT_LADDER_CONFIG.max_active_outgoing_challenges)}
          />
          <p className="text-xs text-muted-foreground">
            Max outgoing challenges a player can have at once
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rechallenge_cooldown_days">
            Rechallenge Cooldown (days)
          </Label>
          <Input
            id="rechallenge_cooldown_days"
            type="number"
            min={0}
            max={30}
            value={config.rechallenge_cooldown_days}
            onChange={(e) => handleChange('rechallenge_cooldown_days', parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Days before the same opponent can be challenged again
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="challenge_acceptance_deadline_days">
            Acceptance Deadline (days)
          </Label>
          <Input
            id="challenge_acceptance_deadline_days"
            type="number"
            min={1}
            max={14}
            value={config.challenge_acceptance_deadline_days}
            onChange={(e) => handleChange('challenge_acceptance_deadline_days', parseInt(e.target.value) || DEFAULT_LADDER_CONFIG.challenge_acceptance_deadline_days)}
          />
          <p className="text-xs text-muted-foreground">
            Days to accept a challenge (walkover if not accepted)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="match_completion_deadline_days">
            Match Completion Deadline (days)
          </Label>
          <Input
            id="match_completion_deadline_days"
            type="number"
            min={1}
            max={30}
            value={config.match_completion_deadline_days}
            onChange={(e) => handleChange('match_completion_deadline_days', parseInt(e.target.value) || DEFAULT_LADDER_CONFIG.match_completion_deadline_days)}
          />
          <p className="text-xs text-muted-foreground">
            Days to complete the match after acceptance
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inactivity_threshold_days">
            Inactivity Threshold (days)
          </Label>
          <Input
            id="inactivity_threshold_days"
            type="number"
            min={1}
            max={60}
            value={config.inactivity_threshold_days}
            onChange={(e) => handleChange('inactivity_threshold_days', parseInt(e.target.value) || DEFAULT_LADDER_CONFIG.inactivity_threshold_days)}
          />
          <p className="text-xs text-muted-foreground">
            Days of inactivity before penalty applies
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inactivity_position_drop">
            Inactivity Position Drop
          </Label>
          <Input
            id="inactivity_position_drop"
            type="number"
            min={1}
            max={10}
            value={config.inactivity_position_drop}
            onChange={(e) => handleChange('inactivity_position_drop', parseInt(e.target.value) || DEFAULT_LADDER_CONFIG.inactivity_position_drop)}
          />
          <p className="text-xs text-muted-foreground">
            Positions dropped when inactivity penalty is applied
          </p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
        <strong>How Ladder works:</strong> Players challenge others ranked above them (within the max challenge positions).
        If the challenged player doesn&apos;t accept within the deadline, the challenger wins by walkover.
        If the challenger wins, they swap positions with the defender.
      </div>
    </div>
  )
}
