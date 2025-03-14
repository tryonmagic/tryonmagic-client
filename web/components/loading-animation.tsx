"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Zap, Brain, Cpu } from "lucide-react"

export function LoadingAnimation() {
  const [progress, setProgress] = useState(0)
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setShowLoading(false), 500) // Delay before hiding
          return 100
        }
        return prev + 5
      })
    }, 150)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {showLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[40rem] w-[40rem] rounded-full bg-purple-600/20 blur-3xl" />
          </div>

          {/* Floating elements */}
          <div className="relative z-10 w-full h-full">
            <motion.div
              className="absolute"
              initial={{ x: "10%", y: "20%", opacity: 0 }}
              animate={{
                x: "15%",
                y: "25%",
                opacity: [0, 0.7, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <Sparkles className="h-12 w-12 text-pink-400/70" />
            </motion.div>

            <motion.div
              className="absolute"
              initial={{ x: "80%", y: "30%", opacity: 0 }}
              animate={{
                x: "75%",
                y: "35%",
                opacity: [0, 0.7, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 3.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                delay: 0.5,
              }}
            >
              <Brain className="h-14 w-14 text-purple-400/70" />
            </motion.div>

            <motion.div
              className="absolute"
              initial={{ x: "30%", y: "70%", opacity: 0 }}
              animate={{
                x: "35%",
                y: "65%",
                opacity: [0, 0.7, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                delay: 1,
              }}
            >
              <Cpu className="h-10 w-10 text-blue-400/70" />
            </motion.div>

            <motion.div
              className="absolute"
              initial={{ x: "70%", y: "60%", opacity: 0 }}
              animate={{
                x: "65%",
                y: "65%",
                opacity: [0, 0.7, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                delay: 1.5,
              }}
            >
              <Zap className="h-16 w-16 text-yellow-400/70" />
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <motion.div
              className="mb-8 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white">
                <span className="relative">
                  <span className="text-white">Prodigy</span>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">AI</span>
                  <motion.span
                    className="absolute -top-16 left-1/2 -translate-x-1/2"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      rotate: { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                      scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                    }}
                  >
                    <Sparkles className="h-12 w-12 text-purple-400" />
                  </motion.span>
                </span>
              </h1>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>

            {/* Loading text */}
            <motion.div
              className="text-white/80 text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {progress < 100 ? <span>Loading AI capabilities... {progress}%</span> : <span>Ready!</span>}
            </motion.div>

            {/* Neural network animation */}
            <div className="mt-12 relative w-64 h-32">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white/30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`line-${i}`}
                  className="absolute h-px bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0"
                  style={{
                    width: `${30 + Math.random() * 70}%`,
                    left: `${Math.random() * 50}%`,
                    top: `${Math.random() * 100}%`,
                    rotate: `${Math.random() * 180 - 90}deg`,
                    transformOrigin: "center",
                  }}
                  animate={{
                    opacity: [0, 0.5, 0],
                    scaleX: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: Math.random() * 3,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

