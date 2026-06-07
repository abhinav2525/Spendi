import { Header } from '@/components/layout/Header'
import { EventList } from '@/components/events/EventList'

export default function EventsPage() {
  return (
    <>
      <Header title="Events" />
      <div className="page-container">
        <EventList />
      </div>
    </>
  )
}
