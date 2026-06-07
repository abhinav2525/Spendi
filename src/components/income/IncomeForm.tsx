'use client'
import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IncomeSchema, IncomeInput } from '@/lib/schemas/income.schema'
import { useCreateIncome, useUpdateIncome } from '@/lib/client/hooks/useIncomes'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toISODate } from '@/lib/utils/dateHelpers'
import { Plus, Trash2 } from 'lucide-react'
import { Income } from '@/types'

interface Props { open: boolean; onClose: () => void; editing?: Income }

export function IncomeForm({ open, onClose, editing }: Props) {
  const create = useCreateIncome()
  const update = useUpdateIncome()

  const defaultAdd = { source: 'salary' as const, frequency: 'monthly' as const, date: toISODate(new Date()), customFields: [] as { label: string; value: string }[] }

  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<IncomeInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(IncomeSchema) as any,
    defaultValues: editing || defaultAdd,
  })

  useEffect(() => {
    if (open) reset(editing || defaultAdd)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const { fields, append, remove } = useFieldArray({ control, name: 'customFields' })

  const onSubmit = (data: IncomeInput) => {
    if (editing) update.mutate({ id: editing.id, input: data }, { onSuccess: onClose })
    else create.mutate(data, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-md max-h-[90vh] overflow-y-auto" style={{border: '1px solid rgba(255,255,255,0.1)'}}>
        <DialogHeader><DialogTitle>{editing ? 'Edit Income' : 'Add Income'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select
                onValueChange={(v) => setValue('source', v as IncomeInput['source'])}
                defaultValue={editing?.source || 'salary'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['salary','business','freelance','bonus','other'].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select
                onValueChange={(v) => setValue('frequency', v as IncomeInput['frequency'])}
                defaultValue={editing?.frequency || 'monthly'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" {...register('amount')} />
              {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register('date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="e.g. June salary, Freelance project..." {...register('description')} />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Fields</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => append({ label: '', value: '' })}
              >
                <Plus size={12} className="mr-1" /> Add Field
              </Button>
            </div>
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="Label" {...register(`customFields.${i}.label`)} className="flex-1" />
                <Input placeholder="Value" {...register(`customFields.${i}.value`)} className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-400"
                  onClick={() => remove(i)}
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
              {editing ? 'Save' : 'Add Income'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
