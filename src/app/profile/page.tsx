'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import debounce from 'lodash/debounce'

type User = {
  id: string
  user_metadata: {
    user_name?: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)


  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      if (!user) throw new Error('User not found')

      // Se l'utente non ha user_name nei metadata, lo inizializziamo
      if (!user.user_metadata?.user_name) {
        const updatedMetadata = {
          ...user.user_metadata,
          user_name: ''
        }
        
        const { error: updateError } = await supabase.auth.updateUser({
          data: updatedMetadata
        })

        if (updateError) throw updateError
        
        user.user_metadata = updatedMetadata
      }

      setUser(user)
      setUserName(user.user_metadata?.user_name || '')
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (newUserName: string) => {
    if (!user) return
    
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          user_name: newUserName
        }
      })
  
      if (error) throw error
      
      setUser(prev => prev ? {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          user_name: newUserName
        }
      } : null)
  
      // Emetti l'evento di aggiornamento
      window.dispatchEvent(new CustomEvent('userNameUpdated', { 
        detail: newUserName 
      }))
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const debouncedUpdate = useCallback(
    debounce((value: string) => {
      updateProfile(value)
    }, 500),
    [user]
  )

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setUserName(newValue)
    debouncedUpdate(newValue)
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id)

      if (error) throw error

      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  useEffect(() => {
    fetchUserProfile()
    
    return () => {
      debouncedUpdate.cancel()
    }
  }, [])

  if (isLoading) {
    return <div>waiting the next apocalypse...</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-8">
        <Card className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Profilo</h1>
          
          <div className="space-y-6">
            <div className="space-y-2">
              
              <div className="relative">
                <Input
                  value={userName}
                  onChange={handleUsernameChange}
                  placeholder="user name"
                  className='font-bold text-xl'
                />
                {isSaving && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    saving bees from extintion...
                  </span>
                )}
              </div>
            </div>

            <div className="pt-6 border-t">
              <h2 className="text-lg font-semibold text-red-600 mb-2">Zona Pericolosa</h2>
              <p className="text-sm text-gray-500 mb-4">
                Una volta eliminato il tuo account, tutti i tuoi dati verranno rimossi permanentemente.
              </p>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina Account
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione Account</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e comporterà la perdita di tutti i tuoi dati, inclusi i preventivi e le impostazioni.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Elimina Account Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}