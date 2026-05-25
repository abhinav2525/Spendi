import { Header } from '@/components/layout/Header'
import { IncomeList } from '@/components/income/IncomeList'

export default function IncomePage() {
  return (
    <>
      <Header title="Income" />
      <div className="page-container">
        <IncomeList />
      </div>
    </>
  )
}
