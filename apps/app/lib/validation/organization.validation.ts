import { z } from 'zod'

export const JoinCodeSchema = z
  .string()
  .min(3, 'Code must be at least 3 characters')
  .max(30, 'Code must be at most 30 characters')
  .regex(/^[A-Za-z0-9-]+$/, 'Code can only contain letters, numbers, and hyphens')
  .transform((val) => val.trim().toUpperCase())

export const PlayerOrganizationSchema = z.object({
  organization_id: z.string().uuid(),
  organization_name: z.string(),
  court_id: z.string().uuid().nullable().optional(),
  added_at: z.string(),
})

export type PlayerOrganization = z.infer<typeof PlayerOrganizationSchema>
