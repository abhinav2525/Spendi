import { Header } from '@/components/layout/Header'
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart'
import { ExpenseBreakdownChart } from '@/components/dashboard/ExpenseBreakdownChart'
import { UpcomingDuesWidget } from '@/components/dashboard/UpcomingDuesWidget'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { CashFlowChart } from '@/components/dashboard/CashFlowChart'

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="md:col-span-2"><IncomeExpenseChart /></div>
          <ExpenseBreakdownChart />
          <CashFlowChart />
          <UpcomingDuesWidget />
          <RecentTransactions />
        </div>
      </div>
    </>
  )
}
