'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Update this version string whenever you want to show the modal again
const CURRENT_VERSION = '2025-10-14'

const WHATS_NEW_CONTENT = {
  version: 'October 14, 2025',
  title: "What's New",
  features: [
    {
      emoji: '🏆',
      title: 'Playoff & Championship Games',
      description: 'Games can now be marked as Regular Season, Playoff, or Championship. Look for blue playoff badges and gold championship badges throughout the app!'
    },
    {
      emoji: '🔍',
      title: 'Game Type Filters',
      description: 'Filter games by type on both the Games page and Stats Viewer. Quickly view only regular season or playoff games with one click.'
    },
    {
      emoji: '📊',
      title: 'Playoff Stats Tab',
      description: 'Click on any player to see their new Playoffs tab! View career playoff totals and game-by-game playoff performance with championship games highlighted.'
    },
    {
      emoji: '📱',
      title: 'Mobile Improvements',
      description: 'Better mobile experience across all pages with improved spacing, responsive layouts, and touch-friendly buttons.'
    },
    {
      emoji: '⚡',
      title: 'Performance & Bug Fixes',
      description: 'Faster page loads, fixed season switching in Stats Viewer, improved Recent Form sorting, and better handling of games without stats.'
    }
  ]
}

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen this version
    const lastSeenVersion = localStorage.getItem('whats_new_last_seen')
    
    if (lastSeenVersion !== CURRENT_VERSION) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('whats_new_last_seen', CURRENT_VERSION)
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {WHATS_NEW_CONTENT.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{WHATS_NEW_CONTENT.version}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-6">
            {WHATS_NEW_CONTENT.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
              >
                <div className="text-3xl flex-shrink-0">{feature.emoji}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button onClick={handleClose} className="btn-primary">
              Got it!
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
