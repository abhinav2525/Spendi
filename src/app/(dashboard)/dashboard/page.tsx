'use client'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart'
import { ExpenseBreakdownChart } from '@/components/dashboard/ExpenseBreakdownChart'
import { UpcomingDuesWidget } from '@/components/dashboard/UpcomingDuesWidget'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { CashFlowChart } from '@/components/dashboard/CashFlowChart'
import { BudgetStatusWidget } from '@/components/dashboard/BudgetStatusWidget'
import { HeroStat } from '@/components/dashboard/HeroStat'

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.34, 1.4, 0.64, 1] as const } },
}

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="page-container">
        <HeroStat />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <motion.div variants={item} className="md:col-span-2"><IncomeExpenseChart /></motion.div>
          <motion.div variants={item}><ExpenseBreakdownChart /></motion.div>
          <motion.div variants={item}><CashFlowChart /></motion.div>
          <motion.div variants={item} className="md:col-span-2"><BudgetStatusWidget /></motion.div>
          <motion.div variants={item}><UpcomingDuesWidget /></motion.div>
          <motion.div variants={item}><RecentTransactions /></motion.div>
        </motion.div>
      </div>
    </>
  )
}
