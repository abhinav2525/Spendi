'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CredentialsSchema, type CredentialsInput } from '@/lib/schemas/auth.schema'
import { signInWithCredentials } from '@/lib/server/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<CredentialsInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CredentialsSchema) as any,
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (data: CredentialsInput) => {
    setError('')
    startTransition(async () => {
      const result = await signInWithCredentials(data)
      if (result.ok) router.push('/dashboard')
      else setError(result.message)
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 15% 20%, oklch(0.93 0.08 30 / 0.55) 0%, transparent 45%),' +
          'radial-gradient(circle at 85% 80%, oklch(0.86 0.10 165 / 0.45) 0%, transparent 50%),' +
          'radial-gradient(circle at 50% 100%, oklch(0.88 0.10 290 / 0.4) 0%, transparent 55%),' +
          'var(--color-background)',
      }}
    >
      <motion.div
        aria-hidden
        className="absolute -top-20 -left-16 w-72 h-72 rounded-full"
        style={{background: 'oklch(0.88 0.12 75 / 0.5)', filter: 'blur(60px)'}}
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full"
        style={{background: 'oklch(0.82 0.13 320 / 0.4)', filter: 'blur(70px)'}}
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="soft-card p-8 space-y-6">
          <div className="text-center space-y-3">
            <span className="candy-tag">
              <Sparkles size={11} /> family finance
            </span>
            <h1 className="text-5xl gradient-text">GharKhata</h1>
            <p className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>
              A warm little ledger for the whole household
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@gharkhata.local"
                className="rounded-2xl h-12"
                {...register('email')}
              />
              {errors.email && <p className="text-xs" style={{color: 'var(--color-destructive)'}}>{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="rounded-2xl h-12"
                {...register('password')}
              />
              {errors.password && <p className="text-xs" style={{color: 'var(--color-destructive)'}}>{errors.password.message}</p>}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-center font-bold"
                style={{color: 'var(--color-destructive)'}}
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-2xl h-12 text-sm font-bold transition-transform active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
              }}
            >
              {isPending ? 'Signing in…' : 'Let me in →'}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-[11px]" style={{color: 'var(--color-muted-foreground)'}}>
              Demo accounts ↓ password: <code style={{fontFamily: 'inherit', fontWeight: 700}}>gharkhata-dev-1234</code>
            </p>
            <div className="flex justify-center gap-2 pt-2 flex-wrap">
              {[
                { name: 'Rajesh', email: 'rajesh@gharkhata.local' },
                { name: 'Priya', email: 'priya@gharkhata.local' },
                { name: 'Arjun', email: 'arjun@gharkhata.local' },
              ].map(d => (
                <span
                  key={d.email}
                  className="text-[10px] px-2 py-1 rounded-full font-bold"
                  style={{
                    background: 'color-mix(in oklch, var(--color-accent) 70%, transparent)',
                    color: 'var(--color-accent-foreground)',
                  }}
                >
                  {d.name} · {d.email}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
