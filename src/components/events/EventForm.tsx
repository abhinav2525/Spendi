'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EventSchema, EventInput, EVENT_EMOJI_PRESETS } from '@/lib/schemas/event.schema'
import { useEventStore } from '@/lib/store/useEventStore'
import { useUser } from '@/lib/client/hooks/useUser'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FinanceEvent, EventScope } from '@/types'
import { toISODate } from '@/lib/utils/dateHelpers'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  scope?: EventScope
  editing?: FinanceEvent
}

export function EventForm({ open, onClose, scope = 'user', editing }: Props) {
  const { addEvent, updateEvent } = useEventStore()
  const { data: currentUser } = useUser()

  const defaultValues: EventInput = editing
    ? {
        scope: editing.scope,
        userId: editing.userId,
        name: editing.name,
        emoji: editing.emoji,
        startDate: editing.startDate,
        endDate: editing.endDate ?? '',
        notes: editing.notes ?? '',
      }
    : {
        scope,
        userId: scope === 'user' ? currentUser?.id : undefined,
        name: '',
        emoji: '🎉',
        startDate: toISODate(new Date()),
        endDate: '',
        notes: '',
      }

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(EventSchema) as any,
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, scope])

  const selectedEmoji = watch('emoji')
  const selectedScope = watch('scope')

  const onSubmit = (data: EventInput) => {
    const payload = {
      scope: data.scope,
      userId: data.scope === 'user' ? (data.userId ?? currentUser?.id) : undefined,
      name: data.name.trim(),
      emoji: data.emoji,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      notes: data.notes?.trim() || undefined,
    }
    if (editing) {
      updateEvent(editing.id, payload)
    } else {
      addEvent(payload)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-md max-h-[90vh] overflow-y-auto" style={{border: '1px solid var(--color-border)'}}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Name</Label>
            <Input placeholder="Diwali 2026, Goa trip, Birthday party…" {...register('name')} className="rounded-2xl" />
            {errors.name && <p className="text-xs" style={{color: 'var(--color-destructive)'}}>{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Pick an emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_EMOJI_PRESETS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setValue('emoji', e)}
                  className={cn(
                    'w-9 h-9 rounded-2xl text-lg flex items-center justify-center transition-all',
                    selectedEmoji === e ? 'scale-110' : 'opacity-60 hover:opacity-100'
                  )}
                  style={selectedEmoji === e ? {
                    background: 'color-mix(in oklch, var(--color-primary) 18%, transparent)',
                    border: '1.5px solid color-mix(in oklch, var(--color-primary) 45%, transparent)',
                  } : {
                    background: 'var(--color-muted)',
                    border: '1.5px solid transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Start</Label>
              <Input type="date" {...register('startDate')} className="rounded-2xl" />
              {errors.startDate && <p className="text-xs" style={{color: 'var(--color-destructive)'}}>{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>End (optional)</Label>
              <Input type="date" {...register('endDate')} className="rounded-2xl" />
              {errors.endDate && <p className="text-xs" style={{color: 'var(--color-destructive)'}}>{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Scope</Label>
            <div className="flex gap-2">
              {(['user', 'household'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setValue('scope', s)
                    setValue('userId', s === 'user' ? currentUser?.id : undefined)
                  }}
                  className="flex-1 py-2 rounded-2xl text-sm font-bold capitalize transition-colors"
                  style={selectedScope === s ? {
                    background: 'color-mix(in oklch, var(--color-primary) 18%, transparent)',
                    color: 'var(--color-primary)',
                    border: '1.5px solid color-mix(in oklch, var(--color-primary) 40%, transparent)',
                  } : {
                    background: 'var(--color-muted)',
                    color: 'var(--color-muted-foreground)',
                    border: '1.5px solid transparent',
                  }}
                >
                  {s === 'user' ? 'Personal' : 'Household'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Notes (optional)</Label>
            <Input placeholder="What's it for?" {...register('notes')} className="rounded-2xl" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              className="flex-1 rounded-2xl font-bold transition-transform active:scale-95"
              style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
            >
              {editing ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
