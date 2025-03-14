"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <h1 className="text-5xl font-bold tracking-tight text-white">
              <span className="relative">
                <span className="text-white">Prodigy</span>
                <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">AI</span>
                <motion.span
                  className="absolute -top-12 left-1/2 -translate-x-1/2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Sparkles className="h-10 w-10 text-purple-400" />
                </motion.span>
              </span>
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

