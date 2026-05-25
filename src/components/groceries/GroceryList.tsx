'use client'
import { useState } from 'react'
import { useGroceryStore } from '@/lib/store/useGroceryStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Trash2, ShoppingCart } from 'lucide-react'
import { GroceryForm } from './GroceryForm'
import { format } from 'date-fns'

export function GroceryList() {
  const { groceries, deleteGrocery } = useGroceryStore()
  const { currentUser } = useAuthStore()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const myGroceries = groceries
    .filter(g => g.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const thisMonthTotal = myGroceries
    .filter(g => g.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, g) => sum + g.totalAmount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>
          This month: <span className="font-semibold" style={{color: 'var(--color-foreground)'}}>{formatCurrency(thisMonthTotal)}</span>
        </div>
        <Button style={{background: 'var(--color-brand-blue)'}} onClick={() => setShowForm(true)}>
          <ShoppingCart size={16} className="mr-2" /> Add Trip
        </Button>
      </div>

      <div className="space-y-3">
        {!myGroceries.length && (
          <div className="glass-card p-8 text-center" style={{color: 'var(--color-muted-foreground)'}}>
            No grocery trips recorded yet
          </div>
        )}
        {myGroceries.map(g => (
          <div key={g.id} className="glass-card overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(expanded === g.id ? null : g.id)}
            >
              <div>
                <p className="font-medium">{g.store || 'Grocery Trip'}</p>
                <p className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>
                  {formatDate(g.date)} · {g.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCurrency(g.totalAmount)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400"
                  onClick={(e) => { e.stopPropagation(); deleteGrocery(g.id) }}
                >
                  <Trash2 size={13} />
                </Button>
                {expanded === g.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expanded === g.id && (
              <div className="px-4 py-3 space-y-1.5" style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                <div className="grid grid-cols-4 text-xs font-medium pb-1" style={{color: 'var(--color-muted-foreground)'}}>
                  <span className="col-span-2">Item</span>
                  <span>Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {g.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 text-sm">
                    <span className="col-span-2">{item.name}</span>
                    <span style={{color: 'var(--color-muted-foreground)'}}>{item.quantity} {item.unit}</span>
                    <span className="text-right">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
                {g.notes && (
                  <p className="text-xs pt-1 mt-2" style={{color: 'var(--color-muted-foreground)', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                    {g.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <GroceryForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  )
}
