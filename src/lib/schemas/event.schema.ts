import { z } from 'zod'

export const EVENT_EMOJI_PRESETS = [
  '🎉', '🎂', '🪔', '🎁', '✈️', '🏖️', '🎄', '💍', '🎓',
  '🏠', '🚗', '🎊', '🌸', '🍽️', '🎨', '⭐',
] as const

export const EventSchema = z.object({
  scope: z.enum(['user', 'household']),
  userId: z.string().optional(),
  name: z.string().min(1, 'Give the event a name'),
  emoji: z.string().min(1).default('🎉'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.scope === 'user' && !data.userId) {
    ctx.addIssue({
      code: 'custom',
      path: ['userId'],
      message: 'User scope requires a userId',
    })
  }
  if (data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'End date must be on or after the start date',
    })
  }
})

export type EventInput = z.infer<typeof EventSchema>
