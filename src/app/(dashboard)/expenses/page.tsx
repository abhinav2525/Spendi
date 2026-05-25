import { Header } from '@/components/layout/Header'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'

export default function ExpensesPage() {
  return (
    <>
      <Header title="Day-to-Day Expenses" />
      <div className="page-container">
        <ExpenseTable />
      </div>
    </>
  )
}
