'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, LoginInput } from '@/lib/schemas/auth.schema'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const { login, users } = useAuthStore()
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = (data: LoginInput) => {
    const success = login(data.memberId, data.pin)
    if (success) router.push('/dashboard')
    else setError('Invalid PIN. Try again.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, oklch(0.145 0 0) 0%, oklch(0.18 0.02 260) 50%, oklch(0.145 0 0) 100%)'}}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold gradient-text">GharKhata</h1>
            <p className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>Family Finance Tracker</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Family Member</Label>
              <Select onValueChange={(v) => setValue('memberId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.memberId && <p className="text-xs text-red-400">{errors.memberId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>PIN</Label>
              <Input type="password" placeholder="Enter PIN" maxLength={6} {...register('pin')} />
              {errors.pin && <p className="text-xs text-red-400">{errors.pin.message}</p>}
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <Button type="submit" className="w-full" style={{background: 'var(--color-brand-blue)'}}>
              Sign In
            </Button>
          </form>

          <p className="text-xs text-center" style={{color: 'var(--color-muted-foreground)'}}>
            Demo PINs: Admin=1234, Priya=1111, Arjun=2222
          </p>
        </div>
      </motion.div>
    </div>
  )
}
