'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { supabase } from '@/lib/supabase'
import TallySurveyDialog from '@/components/tally-form/tally-survey-dialog'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyChecked, setSurveyChecked] = useState(false)
  const pathname = usePathname()
  
  const excludedPages = [
    '/login',
    '/',
    '/terms',
    '/privacy',
    '/auth/reset-password',
    '/about',
    '/pricing',
    '/xyz',
    '/qrt'
  ]
  
  // Verifica se la pagina corrente è nella lista delle pagine escluse
  const shouldHideMenu = 
    excludedPages.includes(pathname) || 
    pathname.startsWith('/ebudgets/') || 
    pathname.startsWith('/public/') || 
    pathname.includes('/preview')

  // Identify pages where we want to show the survey (authenticated pages)
  const shouldShowSurveyPages = [
    '/budgets',
    '/settings',
    '/database'
  ]

  const isPageEligibleForSurvey = shouldShowSurveyPages.some(page => 
    pathname === page || pathname.startsWith(`${page}/`)
  )

  // Check if user has completed the survey
  useEffect(() => {
    const checkSurveyStatus = async () => {
      // Only check for authenticated pages
      if (!isPageEligibleForSurvey || surveyChecked) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Fetch user settings to check if survey has been completed
        const { data, error } = await supabase
          .from('user_settings')
          .select('body')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user settings:', error)
          return
        }

        // Check if user has completed the intro survey
        const hasCompletedSurvey = data?.body?.has_completed_survey_intro === true
        
        // Show survey if not completed
        setShowSurvey(!hasCompletedSurvey)
        setSurveyChecked(true)
      } catch (error) {
        console.error('Error checking survey status:', error)
      }
    }

    checkSurveyStatus()
  }, [pathname, isPageEligibleForSurvey, surveyChecked])

  // Chiamato SOLO quando l'utente completa effettivamente il form
  const handleSurveyComplete = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user settings with completed survey flag
      const { data, error } = await supabase
        .from('user_settings')
        .select('body')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user settings for update:', error)
        return
      }

      // Update the body field with the new survey flag
      const updatedBody = {
        ...data.body,
        has_completed_survey_intro: true
      }

      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ body: updatedBody })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating user settings:', updateError)
        return
      }

      // Close the survey dialog
      setShowSurvey(false)
      console.log('Utente ha completato il form con successo, stato salvato nel DB')
    } catch (error) {
      console.error('Error marking survey as complete:', error)
    }
  }

  // Chiamato quando l'utente chiude il popup senza completare
  const handleSurveyClose = () => {
    console.log('Utente ha chiuso il form senza completare, non salviamo niente nel DB')
    // Nascondiamo semplicemente il popup, ma NON aggiorniamo il DB
    // Così alla prossima visita della pagina, il popup apparirà di nuovo
    setShowSurvey(false)
    // Resettiamo lo stato di verifica così che possa essere controllato di nuovo
    setSurveyChecked(false)
  }

  // Se la pagina è nella lista delle escluse, mostra solo il contenuto
  if (shouldHideMenu) {
    return children
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`${isCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1`}>
          {children}
        </main>
      </div>
      
      {/* Show Tally Survey Dialog if needed */}
      {isPageEligibleForSurvey && (
        <TallySurveyDialog 
          open={showSurvey}
          onComplete={handleSurveyComplete}
          onClose={handleSurveyClose}
        />
      )}
    </>
  )
}