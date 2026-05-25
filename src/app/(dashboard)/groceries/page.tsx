import { Header } from '@/components/layout/Header'
import { GroceryList } from '@/components/groceries/GroceryList'

export default function GroceriesPage() {
  return (
    <>
      <Header title="Groceries" />
      <div className="page-container">
        <GroceryList />
      </div>
    </>
  )
}
