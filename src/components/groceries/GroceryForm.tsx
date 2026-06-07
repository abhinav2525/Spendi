'use client'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GroceryEntrySchema, GroceryEntryInput } from '@/lib/schemas/grocery.schema'
import { useCreateGrocery } from '@/lib/client/hooks/useGroceries'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { toISODate } from '@/lib/utils/dateHelpers'
import { useEffect } from 'react'

interface Props { open: boolean; onClose: () => void }

export function GroceryForm({ open, onClose }: Props) {
  const create = useCreateGrocery()

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<GroceryEntryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(GroceryEntrySchema) as any,
    defaultValues: {
      date: toISODate(new Date()),
      items: [{ name: '', quantity: 1, unit: 'kg', pricePerUnit: 0, totalPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  useEffect(() => {
    watchedItems?.forEach((item, i) => {
      const total = (Number(item.quantity) || 0) * (Number(item.pricePerUnit) || 0)
      setValue(`items.${i}.totalPrice`, total)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedItems)])

  const onSubmit = (data: GroceryEntryInput) => {
    // Server recomputes totalAmount from items — we don't pass it.
    create.mutate(data, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-lg max-h-[90vh] overflow-y-auto" style={{border: '1px solid rgba(255,255,255,0.1)'}}>
        <DialogHeader><DialogTitle>Add Grocery Trip</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register('date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Store (optional)</Label>
              <Input placeholder="D-Mart, BigBazaar..." {...register('store')} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => append({ name: '', quantity: 1, unit: 'kg', pricePerUnit: 0, totalPrice: 0 })}
              >
                <Plus size={12} className="mr-1" /> Add Item
              </Button>
            </div>
            <div className="grid grid-cols-5 gap-1 text-xs px-1" style={{color: 'var(--color-muted-foreground)'}}>
              <span className="col-span-2">Item</span><span>Qty</span><span>Unit</span><span>Price/Unit</span>
            </div>
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-1">
                <div className="grid grid-cols-5 gap-1 flex-1">
                  <Input placeholder="Rice" {...register(`items.${i}.name`)} className="col-span-2 h-8 text-sm" />
                  <Input type="number" min="0" step="0.1" {...register(`items.${i}.quantity`)} className="h-8 text-sm" />
                  <Input placeholder="kg" {...register(`items.${i}.unit`)} className="h-8 text-sm" />
                  <Input type="number" min="0" {...register(`items.${i}.pricePerUnit`)} className="h-8 text-sm" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-400"
                  onClick={() => remove(i)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
            {errors.items && <p className="text-xs text-red-400">Add at least one item</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input placeholder="Monthly stock-up, festival shopping..." {...register('notes')} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              className="flex-1 rounded-2xl font-bold transition-transform active:scale-95"
              style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
            >Save Trip</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
