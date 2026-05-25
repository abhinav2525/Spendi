import { Header } from '@/components/layout/Header'
import { SubscriptionGrid } from '@/components/subscriptions/SubscriptionGrid'

export default function SubscriptionsPage() {
  return (
    <>
      <Header title="Subscriptions" />
      <div className="page-container">
        <SubscriptionGrid />
      </div>
    </>
  )
}
