'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SubscriptionSchema, SubscriptionInput } from '@/lib/schemas/subscription.schema'
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toISODate } from '@/lib/utils/dateHelpers'
import { Subscription } from '@/types'

interface Props { open: boolean; onClose: () => void; editing?: Subscription }

export function SubscriptionForm({ open, onClose, editing }: Props) {
  const { addSubscription, updateSubscription } = useSubscriptionStore()
  const { currentUser } = useAuthStore()

  const defaultAdd = { frequency: 'monthly' as const, category: 'other' as const, isActive: true, renewalDate: toISODate(new Date()) }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<SubscriptionInput>({
    resolver: zodResolver(SubscriptionSchema) as any,
    defaultValues: editing || defaultAdd,
  })

  useEffect(() => {
    if (open) reset(editing || defaultAdd)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const onSubmit = (data: SubscriptionInput) => {
    if (editing) updateSubscription(editing.id, data)
    else addSubscription({ ...data, userId: currentUser!.id })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-md" style={{border: '1px solid rgba(255,255,255,0.1)'}}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Service Name</Label>
            <Input placeholder="Netflix, Jio Fiber, Spotify..." {...register('name')} />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" {...register('amount')} />
              {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Billing</Label>
              <Select
                onValueChange={(v) => setValue('frequency', v as SubscriptionInput['frequency'])}
                defaultValue={editing?.frequency || 'monthly'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                onValueChange={(v) => setValue('category', v as SubscriptionInput['category'])}
                defaultValue={editing?.category || 'other'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['entertainment','utility','productivity','health','other'].map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Next Renewal</Label>
              <Input type="date" {...register('renewalDate')} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" style={{background: 'var(--color-brand-blue)'}}>
              {editing ? 'Save' : 'Add Subscription'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
