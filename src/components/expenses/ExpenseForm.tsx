'use client'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExpenseSchema, ExpenseInput } from '@/lib/schemas/expense.schema'
import { useExpenseStore } from '@/lib/store/useExpenseStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
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
  const { addExpense, updateExpense } = useExpenseStore()
  const { currentUser } = useAuthStore()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<ExpenseInput>({
    resolver: zodResolver(ExpenseSchema) as any,
    defaultValues: editing ? {
      amount: editing.amount,
      category: editing.category,
      description: editing.description,
      date: editing.date,
      isRecurring: editing.isRecurring,
      paymentMode: editing.paymentMode,
      tags: editing.tags,
      customFields: editing.customFields,
    } : {
      date: toISODate(new Date()),
      isRecurring: false,
      tags: [],
      customFields: [],
      paymentMode: 'upi',
    },
  })

  const { fields: cfFields, append: cfAppend, remove: cfRemove } = useFieldArray({ control, name: 'customFields' })

  const onSubmit = (data: ExpenseInput) => {
    if (editing) {
      updateExpense(editing.id, data)
    } else {
      addExpense({ ...data, userId: currentUser!.id })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-md max-h-[90vh] overflow-y-auto" style={{border: '1px solid rgba(255,255,255,0.1)'}}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="0" {...register('amount')} />
              {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register('date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="What did you spend on?" {...register('description')} />
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
            <Button type="submit" className="flex-1" style={{background: 'var(--color-brand-blue)'}}>
              {editing ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
