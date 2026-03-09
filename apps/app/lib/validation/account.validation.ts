import { z } from 'zod'

export const AccountDeletionConfirmationSchema = z.object({
  confirmationText: z.string().refine(
    (value) => value === 'DELETE',
    {
      message: 'You must type "DELETE" exactly to confirm account deletion'
    }
  ),
  userId: z.string().uuid('Invalid user ID format'),
})

export type AccountDeletionConfirmation = z.infer<typeof AccountDeletionConfirmationSchema>