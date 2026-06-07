import { Header } from '@/components/layout/Header'
import { BudgetTable } from '@/components/budgets/BudgetTable'

export default function BudgetsPage() {
  return (
    <>
      <Header title="Budgets" />
      <div className="page-container space-y-6">
        <BudgetTable scope="user" />
        <BudgetTable scope="household" />
      </div>
    </>
  )
}
