'use client'
import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExpenseSchema, ExpenseInput } from '@/lib/schemas/expense.schema'
import { useCreateExpense, useUpdateExpense } from '@/lib/client/hooks/useExpenses'
import { useEventStore } from '@/lib/store/useEventStore'
import { useUser } from '@/lib/client/hooks/useUser'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toISODate } from '@/lib/utils/dateHelpers'
import { Plus, Trash2 } from 'lucide-react'
import { Expense } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Expense
}

export function ExpenseForm({ open, onClose, editing }: Props) {
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const { events } = useEventStore()
  const { data: currentUser } = useUser()

  // Events the current user can tag against: their own + household
  const taggableEvents = events
    .filter(e => e.scope === 'household' || e.userId === currentUser?.id)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  const defaultAdd = { date: toISODate(new Date()), isRecurring: false, tags: [] as string[], customFields: [] as { label: string; value: string }[], paymentMode: 'upi' as const, eventId: undefined as string | undefined }

  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors } } = useForm<ExpenseInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ExpenseSchema) as any,
    defaultValues: editing ? {
      amount: editing.amount, category: editing.category, description: editing.description,
      date: editing.date, isRecurring: editing.isRecurring, recurringPeriod: editing.recurringPeriod,
      paymentMode: editing.paymentMode, tags: editing.tags, customFields: editing.customFields,
      eventId: editing.eventId,
    } : defaultAdd,
  })

  useEffect(() => {
    if (open) reset(editing ? {
      amount: editing.amount, category: editing.category, description: editing.description,
      date: editing.date, isRecurring: editing.isRecurring, recurringPeriod: editing.recurringPeriod,
      paymentMode: editing.paymentMode, tags: editing.tags, customFields: editing.customFields,
      eventId: editing.eventId,
    } : defaultAdd)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const isRecurring = watch('isRecurring')

  const { fields: cfFields, append: cfAppend, remove: cfRemove } = useFieldArray({ control, name: 'customFields' })

  const onSubmit = (data: ExpenseInput) => {
    const payload = { ...data, eventId: data.eventId || undefined }
    if (editing) {
      update.mutate({ id: editing.id, input: payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload, { onSuccess: onClose })
    }
  }

  const selectedEventId = watch('eventId')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-md max-h-[90vh] overflow-y-auto" style={{border: '1px solid rgba(255,255,255,0.1)'}}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (₹)</Label>
              <Input id="exp-amount" type="number" placeholder="0" {...register('amount')} />
              {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" type="date" {...register('date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Description</Label>
            <Input id="exp-desc" placeholder="What did you spend on?" {...register('description')} />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                onValueChange={(v) => setValue('category', v as ExpenseInput['category'])}
                defaultValue={editing?.category}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['food','transport','utilities','entertainment','shopping','health','education','other'].map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select
                onValueChange={(v) => setValue('paymentMode', v as ExpenseInput['paymentMode'])}
                defaultValue={editing?.paymentMode || 'upi'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['cash','upi','card','netbanking'].map(m => (
                    <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="exp-recurring"
              type="checkbox"
              className="w-4 h-4 accent-blue-500"
              {...register('isRecurring')}
            />
            <Label htmlFor="exp-recurring" className="cursor-pointer">Recurring expense</Label>
          </div>

          {isRecurring && (
            <div className="space-y-1.5">
              <Label>Recurring Period</Label>
              <Select
                onValueChange={(v) => setValue('recurringPeriod', v as ExpenseInput['recurringPeriod'])}
                defaultValue={editing?.recurringPeriod || 'monthly'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {taggableEvents.length > 0 && (
            <div className="space-y-1.5">
              <Label>Event (optional)</Label>
              <Select
                value={selectedEventId ?? '__none__'}
                onValueChange={(v) => setValue('eventId', v === '__none__' ? undefined : v)}
              >
                <SelectTrigger><SelectValue placeholder="No event" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No event</SelectItem>
                  {taggableEvents.map(ev => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.emoji} {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Fields</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => cfAppend({ label: '', value: '' })}
                className="h-7 text-xs"
              >
                <Plus size={12} className="mr-1" /> Add Field
              </Button>
            </div>
            {cfFields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="Label" {...register(`customFields.${i}.label`)} className="flex-1" />
                <Input placeholder="Value" {...register(`customFields.${i}.value`)} className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-red-400"
                  onClick={() => cfRemove(i)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              className="flex-1 rounded-2xl font-bold transition-transform active:scale-95"
              style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
            >
              {editing ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
