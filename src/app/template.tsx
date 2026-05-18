'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  return (
    <div style={{ perspective: '1200px' }} className="w-full h-full overflow-visible">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ 
            opacity: 0, 
            y: 35, 
            scale: 0.96, 
            rotateX: 12, 
            filter: 'blur(10px)',
            transformOrigin: 'top center'
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            rotateX: 0, 
            filter: 'blur(0px)' 
          }}
          exit={{ 
            opacity: 0, 
            y: -35, 
            scale: 0.96, 
            rotateX: -12, 
            filter: 'blur(10px)',
            transformOrigin: 'bottom center'
          }}
          transition={{ 
            type: 'spring',
            stiffness: 140,
            damping: 18,
            mass: 0.8
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
