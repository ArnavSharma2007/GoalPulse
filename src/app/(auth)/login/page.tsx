'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) { setError(error.message); setLoading(false); return }

    // Fetch role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // Trigger boot transition
    setBooting(true)
    setTimeout(() => {
      router.push(`/${user?.role}/dashboard`)
    }, 1200) // wait for animation
  }

  return (
    <div className="min-h-screen flex items-center justify-center aurora-shift relative overflow-hidden">
      
      <AnimatePresence>
        {!booting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)", y: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full max-w-md relative z-10 px-4"
          >
            <Card className="w-full glass-card border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 h-12 flex items-center justify-center">
                  <img src="/logo.png" alt="GoalPulse Logo" className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                </div>
                <p className="text-indigo-200 text-sm mt-1 font-medium tracking-wide uppercase">Performance Management</p>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                {error && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg px-4 py-3">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
                <Button
                  id="login-submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Authenticating...
                    </span>
                  ) : 'Sign In →'}
                </Button>
                <p className="text-center text-slate-400 text-xs mt-2">
                  Demo: employee@test.com · manager@test.com · admin@test.com
                </p>
                <p className="text-center text-slate-500 text-xs font-mono">Test@1234</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boot Transition Overlay */}
      <AnimatePresence>
        {booting && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 150, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 w-10 h-10 bg-slate-950 rounded-full"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {booting && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             transition={{ delay: 0.3, duration: 0.5 }}
             className="absolute z-50 flex flex-col items-center justify-center pointer-events-none"
           >
              <img src="/icon.png" alt="Boot Logo" className="w-20 animate-pulse" />
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
