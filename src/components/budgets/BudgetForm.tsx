'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BudgetSchema, BudgetInput, BUDGET_CATEGORIES } from '@/lib/schemas/budget.schema'
import { useSetBudget, useUpdateBudget } from '@/lib/client/hooks/useBudgets'
import { useUser } from '@/lib/client/hooks/useUser'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Budget, BudgetScope } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  scope: BudgetScope
  editing?: Budget
}

export function BudgetForm({ open, onClose, scope, editing }: Props) {
  const set = useSetBudget()
  const update = useUpdateBudget()
  // currentUser is only used to seed the form's userId field for the Zod superRefine —
  // the Server Action overrides it with the authenticated member's id.
  const { data: currentUser } = useUser()

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<BudgetInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(BudgetSchema) as any,
    defaultValues: editing ?? {
      scope,
      userId: scope === 'user' ? currentUser?.id : undefined,
      category: 'overall',
      monthlyLimit: 0,
    },
  })

  useEffect(() => {
    if (open) {
      reset(editing ?? {
        scope,
        userId: scope === 'user' ? currentUser?.id : undefined,
        category: 'overall',
        monthlyLimit: 0,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, scope])

  const onSubmit = (data: BudgetInput) => {
    const payload = {
      scope: data.scope,
      userId: data.scope === 'user' ? (data.userId ?? currentUser?.id) : undefined,
      category: data.category,
      monthlyLimit: data.monthlyLimit,
    }
    if (editing) {
      update.mutate({ id: editing.id, input: payload }, { onSuccess: onClose })
    } else {
      set.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-md" style={{border: '1px solid rgba(255,255,255,0.1)'}}>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Budget' : `Add ${scope === 'household' ? 'Household' : 'Personal'} Budget`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              onValueChange={(v) => setValue('category', v as BudgetInput['category'])}
              defaultValue={editing?.category ?? 'overall'}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c === 'overall' ? 'All categories (overall)' : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-limit">Monthly limit (₹)</Label>
            <Input id="budget-limit" type="number" min="0" placeholder="0" {...register('monthlyLimit')} />
            {errors.monthlyLimit && <p className="text-xs text-red-400">{errors.monthlyLimit.message}</p>}
          </div>

          <p className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>
            {scope === 'household'
              ? 'Household budgets apply when viewing the family\'s combined spending.'
              : 'Personal budgets apply only to your own spending.'}
          </p>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              className="flex-1 rounded-2xl font-bold transition-transform active:scale-95"
              style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
            >
              {editing ? 'Save' : 'Add Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
