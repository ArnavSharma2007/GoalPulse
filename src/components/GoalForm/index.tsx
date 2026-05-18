'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UomType } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, CalendarDays, Target, AlertCircle } from 'lucide-react'

interface Props {
  sheetId: string
  onClose: () => void
  onSaved: () => void
}

const UOM_OPTIONS = [
  { value: 'numeric_min' as UomType, label: 'Numeric — Higher is Better', hint: 'e.g. Revenue, Sales units, Satisfaction score', icon: TrendingUp },
  { value: 'numeric_max' as UomType, label: 'Numeric — Lower is Better', hint: 'e.g. TAT days, Cost, Error rate', icon: TrendingDown },
  { value: 'timeline' as UomType, label: 'Timeline — Date-based', hint: 'e.g. Project completion, Milestone delivery', icon: CalendarDays },
  { value: 'zero' as UomType, label: 'Zero Target', hint: 'e.g. Safety incidents, Violations, Defects', icon: Target },
]

export function GoalForm({ sheetId, onClose, onSaved }: Props) {
  const supabase = createClient()
  const [thrustAreas, setThrustAreas] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    thrust_area_id: '',
    uom_type: '' as UomType | '',
    target_value: '',
    target_date: '',
    weightage: '20',
  })

  useEffect(() => {
    supabase.from('thrust_areas').select('*').order('name').then(({ data }) => setThrustAreas(data || []))
  }, [])

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setError('')
    if (!form.title.trim()) { setError('Goal title is required'); return }
    if (!form.uom_type) { setError('Please select a unit of measurement'); return }
    if (Number(form.weightage) < 10) { setError('Minimum weightage is 10%'); return }
    if (form.uom_type !== 'zero' && form.uom_type !== 'timeline' && !form.target_value) {
      setError('Target value is required for this UoM type'); return
    }
    if (form.uom_type === 'timeline' && !form.target_date) {
      setError('Target date is required for timeline goals'); return
    }

    setSaving(true)
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_sheet_id: sheetId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        thrust_area_id: form.thrust_area_id || null,
        uom_type: form.uom_type,
        target_value: (form.uom_type !== 'zero' && form.uom_type !== 'timeline' && form.target_value)
          ? Number(form.target_value) : null,
        target_date: form.uom_type === 'timeline' ? form.target_date : null,
        weightage: Number(form.weightage),
      })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save goal'); setSaving(false); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-xl my-8 relative"
      >
        <div className="glass-panel border-white/20 rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(16,185,129,0.15)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="border-b border-white/10 px-8 py-5 flex justify-between items-center bg-white/5 relative z-10">
            <h2 className="text-xl font-bold text-white tracking-tight">Add New Goal</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
              <X size={18} />
            </button>
          </div>

          <div className="p-8 space-y-6 relative z-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Goal Title <span className="text-rose-400">*</span></Label>
              <Input
                id="goal-title"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Achieve ₹50L quarterly revenue"
                className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 rounded-xl h-12 px-4 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Description <span className="text-slate-500 font-normal lowercase">(optional)</span></Label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe what success looks like..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            {/* Thrust Area */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Thrust Area</Label>
              <select
                value={form.thrust_area_id}
                onChange={e => update('thrust_area_id', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none transition-all"
              >
                <option value="" className="bg-slate-900">Select thrust area...</option>
                {thrustAreas.map(ta => (
                  <option key={ta.id} value={ta.id} className="bg-slate-900">{ta.name}</option>
                ))}
              </select>
            </div>

            {/* UoM Type */}
            <div className="space-y-3">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Unit of Measurement <span className="text-rose-400">*</span></Label>
              <div className="grid grid-cols-1 gap-3">
                {UOM_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const isSelected = form.uom_type === opt.value
                  return (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={opt.value}
                      onClick={() => update('uom_type', opt.value)}
                      className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{opt.hint}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Target value/date */}
            <AnimatePresence>
              {form.uom_type && form.uom_type !== 'zero' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {form.uom_type === 'timeline' ? (
                    <>
                      <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold pt-2">Target Completion Date <span className="text-rose-400">*</span></Label>
                      <Input
                        type="date"
                        value={form.target_date}
                        onChange={e => update('target_date', e.target.value)}
                        className="bg-black/40 border-white/10 text-white focus:ring-2 focus:ring-emerald-500/50 rounded-xl h-12 px-4 transition-all"
                      />
                    </>
                  ) : (
                    <>
                      <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold pt-2">Target Value <span className="text-rose-400">*</span></Label>
                      <Input
                        type="number"
                        value={form.target_value}
                        onChange={e => update('target_value', e.target.value)}
                        placeholder={form.uom_type === 'numeric_min' ? 'e.g. 5000000' : 'e.g. 3'}
                        className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 rounded-xl h-12 px-4 transition-all"
                      />
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weightage Slider */}
            <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center">
                <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Weightage</Label>
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{form.weightage}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={form.weightage}
                onChange={e => update('weightage', e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Min: 10%</span>
                <span>Max: 80%</span>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 flex items-center gap-2"
                >
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  <p className="text-rose-300 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 pt-4 border-t border-white/10">
              <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10 h-12 rounded-xl transition-all">
                Cancel
              </Button>
              <Button
                id="save-goal-btn"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex justify-center items-center gap-2"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : 'Add Goal'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
