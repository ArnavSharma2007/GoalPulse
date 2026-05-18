'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EmployeeDashboard() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
        <p className="text-slate-400">Here's your performance overview for the current cycle.</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={item}>
          <Card className="glass-card border-l-4 border-l-amber-500 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Goal Status</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Draft</div>
              <p className="text-xs text-slate-400 mt-1">Submit before cycle closes</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="glass-card border-l-4 border-l-indigo-500 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Goals</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0 / 8</div>
              <p className="text-xs text-slate-400 mt-1">Maximum 8 goals allowed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass-card border-l-4 border-l-purple-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Predicted Score</CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">—</div>
              <p className="text-xs text-slate-400 mt-1">Requires Q1/Q2 check-ins</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
