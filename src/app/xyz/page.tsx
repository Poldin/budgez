'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Trash2, 
  Edit, 
  Search, 
  Filter, 
  LogOut, 
  UserPlus, 
  Settings,
  Database,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import DashboardMetrics from './dashboard/dashboard'

// Definizione delle interfacce
interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null | undefined
  is_admin: boolean
  status: string
  is_super_admin: boolean
}

export default function AdminDashboard() {
  // Stati per gli utenti e i filtrisupe
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  
  // Stati per gestire i dialoghi
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Stati per il form di modifica
  const [editFormData, setEditFormData] = useState({
    email: '',
    is_admin: false,
    status: 'active'
  })
  
  // Stati per il form di aggiunta
  const [addFormData, setAddFormData] = useState({
    email: '',
    password: '',
    is_admin: false
  })
  
  // Stato per mostrare/nascondere la password
  const [showPassword, setShowPassword] = useState(false)

  // Verifica se l'utente corrente è un super admin
  const checkSuperAdminAccess = async () => {
    setIsCheckingAccess(true)
    try {
      // Ottieni l'utente corrente
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsSuperAdmin(false)
        return
      }
      
      // Ottieni i metadati dell'utente usando la service role key
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(user.id)
      
      if (error) throw error
      
      // Controlla se is_super_admin è impostato nei metadati
      setIsSuperAdmin(data?.user?.app_metadata?.is_super_admin === true)
    } catch (error) {
      console.error('Errore nella verifica dei permessi:', error)
      setIsSuperAdmin(false)
    } finally {
      setIsCheckingAccess(false)
    }
  }
  
  // Funzione per caricare gli utenti
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // Utilizziamo l'API di amministrazione con service role key
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) throw error
      
      // Converti i dati dell'API nel formato preciso richiesto dall'interfaccia User
      const formattedUsers: User[] = data.users.map(user => ({
        id: user.id,
        email: user.email || 'N/A',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        is_admin: user.app_metadata?.is_admin || false,
        status: 'active',
        is_super_admin: user.app_metadata?.is_super_admin || false
      }))
      
      setUsers(formattedUsers)
      setFilteredUsers(formattedUsers)
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Funzione per eliminare un utente
  const handleDelete = async () => {
    if (!selectedUser) return
    
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(
        selectedUser.id
      )
      
      if (error) throw error
      
      // Aggiorna la lista degli utenti
      await fetchUsers()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'utente:', error)
    }
  }
  
  // Funzione per modificare un utente
  const handleEdit = async () => {
    if (!selectedUser) return
    
    try {
      // Aggiorniamo gli attributi dell'utente
      const updateData: {
        email: string;
        app_metadata: { is_admin: boolean };
        banned?: boolean;  // Aggiungi questa proprietà opzionale
      } = {
        email: editFormData.email,
        app_metadata: { is_admin: editFormData.is_admin }
      }
      
      // Gestiamo lo stato dell'utente
      if (editFormData.status === 'banned') {
        updateData.banned = true
      }
      
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        selectedUser.id,
        updateData
      )
      
      if (error) throw error
      
      // Se lo stato è "deleted", dobbiamo chiamare deleteUser
      if (editFormData.status === 'deleted') {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          selectedUser.id
        )
        
        if (deleteError) throw deleteError
      }
      
      // Aggiorna la lista degli utenti
      await fetchUsers()
      setShowEditDialog(false)
    } catch (error) {
      console.error('Errore nella modifica dell\'utente:', error)
    }
  }
  
  // Funzione per aggiungere un utente
  const handleAdd = async () => {
    try {
      // Prima creiamo l'utente nell'auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: addFormData.email,
        password: addFormData.password,
        email_confirm: true
      })
      
      if (error) throw error
      
      // Poi impostiamo i dati aggiuntivi
      if (addFormData.is_admin) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          data.user.id,
          {
            app_metadata: { is_admin: true }
          }
        )
        
        if (updateError) throw updateError
      }
      
      // Aggiorna la lista degli utenti
      await fetchUsers()
      setShowAddDialog(false)
      
      // Reset del form
      setAddFormData({
        email: '',
        password: '',
        is_admin: false
      })
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'utente:', error)
    }
  }
  
  // Gestione del filtro di ricerca
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      return matchesSearch && matchesStatus
    })
    
    setFilteredUsers(filtered)
  }, [searchTerm, statusFilter, users])
  
  // Controllo iniziale delle autorizzazioni e caricamento degli utenti
  useEffect(() => {
    const init = async () => {
      await checkSuperAdminAccess()
      if (isSuperAdmin) {
        fetchUsers()
      }
    }

    init()
  }, [isSuperAdmin])
  
  // Funzione per visualizzare il badge di stato
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-200 text-green-800">Attivo</Badge>
      case 'banned':
        return <Badge className="bg-red-200 text-red-800">Bannato</Badge>
      case 'deleted':
        return <Badge className="bg-gray-200 text-gray-800">Eliminato</Badge>
      default:
        return <Badge>Sconosciuto</Badge>
    }
  }
  
  // Renderizza la pagina di accesso negato se l'utente non è un super admin
  if (isCheckingAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verifica dei permessi in corso...</h1>
          <p className="text-gray-500">Attendi mentre verifichiamo i tuoi permessi.</p>
        </div>
      </div>
    )
  }
  
  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-4">Accesso negato</h1>
          <p className="text-gray-500 mb-6">
            Non disponi dei permessi necessari per accedere a questa pagina. 
            È richiesto il ruolo di Super Admin.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Torna alla home
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-black text-white p-6">
        <div className="mb-10">
          <h1 className="text-xl font-bold">Super Admin</h1>
          <p className="text-gray-400 text-sm">Pannello di gestione</p>
        </div>
        
        <nav className="space-y-1">
          <a href="#" className="flex items-center space-x-2 py-2 px-3 rounded-lg bg-gray-800">
            <Users size={20} />
            <span>Utenti</span>
          </a>
          <a href="#" className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-gray-800">
            <Database size={20} />
            <span>Dati</span>
          </a>
          <a href="#" className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-gray-800">
            <Shield size={20} />
            <span>Permessi</span>
          </a>
          <a href="#" className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-gray-800">
            <Settings size={20} />
            <span>Impostazioni</span>
          </a>
        </nav>
        
        <div className="mt-auto pt-6">
          <a href="#" className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-gray-800">
            <LogOut size={20} />
            <span>Logout</span>
          </a>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" /> Utenti
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Impostazioni
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Gestione Utenti</h1>
                  <p className="text-gray-500 mb-6 text-sm">
                    Visualizza, modifica, aggiungi ed elimina utenti dal sistema.
                  </p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Aggiungi Utente
                </Button>
              </div>
              
              {/* Filtri e ricerca */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca per email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="active">Attivi</SelectItem>
                    <SelectItem value="banned">Bannati</SelectItem>
                    <SelectItem value="deleted">Eliminati</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchUsers}>
                  Aggiorna
                </Button>
              </div>
              
              {/* Tabella utenti */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Email</TableHead>
                      <TableHead>Data creazione</TableHead>
                      <TableHead>Ultimo accesso</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          Caricamento in corso...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          Nessun utente trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            {user.last_sign_in_at ? 
                              new Date(user.last_sign_in_at).toLocaleString() : 
                              'Mai'}
                          </TableCell>
                          <TableCell>
                            <Badge className={user.is_admin ? 
                              "bg-purple-200 text-purple-800" : 
                              "bg-blue-200 text-blue-800"}>
                              {user.is_admin ? 'Admin' : 'Utente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {renderStatusBadge(user.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setEditFormData({
                                    email: user.email,
                                    is_admin: user.is_admin,
                                    status: user.status
                                  })
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowDeleteDialog(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="dashboard">
            <DashboardMetrics />
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Impostazioni di Sistema</h2>
              <p className="text-gray-500 mb-6">
                Questa funzionalità verrà implementata in futuro.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Dialog per eliminare utente */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare l&apos;utente {selectedUser?.email}? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog per modificare utente */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica i dettagli dell&apos;utente selezionato.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Stato</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({...editFormData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="banned">Bannato</SelectItem>
                  <SelectItem value="deleted">Eliminato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is-admin"
                checked={editFormData.is_admin}
                onCheckedChange={(checked) => setEditFormData({...editFormData, is_admin: checked})}
              />
              <Label htmlFor="is-admin">Amministratore</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleEdit}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog per aggiungere utente */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Utente</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli per creare un nuovo utente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addFormData.email}
                onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? "text" : "password"}
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="add-is-admin"
                checked={addFormData.is_admin}
                onCheckedChange={(checked) => setAddFormData({...addFormData, is_admin: checked})}
              />
              <Label htmlFor="add-is-admin">Amministratore</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleAdd}>
              Crea Utente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}