'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart,
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Users, Database,  UserCheck, Link } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { format } from 'date-fns'




interface BudgetCreator {
  creator_email: string
  count: number
}


interface ExternalUserFrequency {
  external_email: string
  count: number
}

interface TimeSeriesData {
  date: string
  count: number
}

interface AdoptionMetric {
  name: string
  value: number
}

export default function DashboardMetrics() {
  // Stati per i dati
  const [isLoading, setIsLoading] = useState(true)
  const [usersCount, setUsersCount] = useState(0)
  const [budgetsCount, setBudgetsCount] = useState(0)
  const [userGrowthData, setUserGrowthData] = useState<TimeSeriesData[]>([])
  const [budgetGrowthData, setBudgetGrowthData] = useState<TimeSeriesData[]>([])
  const [topBudgetCreators, setTopBudgetCreators] = useState<BudgetCreator[]>([])
  const [creatorDistribution, setCreatorDistribution] = useState<AdoptionMetric[]>([])
  const [totalLinks, setTotalLinks] = useState(0)
  const [linksWithoutUser, setLinksWithoutUser] = useState(0)
  const [topAssignedUsers, setTopAssignedUsers] = useState<ExternalUserFrequency[]>([])
  const [linkUserAdoption, setLinkUserAdoption] = useState<AdoptionMetric[]>([])

  // Colori per i grafici
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57']

  // Fetch di tutti i dati necessari
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchUsersData(),
          fetchBudgetsData(),
          fetchLinkBudgetUsersData()
        ])
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllData()
  }, [])

  // Fetch dei dati degli utenti
const fetchUsersData = async () => {
    try {
      // Numero totale di utenti usando supabaseAdmin
      // Nota: "auth.users" è specificato direttamente come argomento di from()
      const { data, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, created_at, email')
        .is('deleted_at', null)
        
      if (usersError) throw usersError
      
      // Gestisci il caso in cui data sia null o undefined
      const users = data || [];
      
      // Imposta il conteggio degli utenti
      setUsersCount(users.length);
  
      // Crescita utenti nel tempo
      const growthData = processTimeSeriesData(users.map(user => ({ created_at: user.created_at })));
      setUserGrowthData(growthData);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
      setUsersCount(0);
      setUserGrowthData([]);
    }
  }

  // Fetch dei dati dei budget
  const fetchBudgetsData = async () => {
    try {
      // Numero totale di budget
      const { count: budgetCount, error: countError } = await supabase
        .from('budgets')
        .select('id', { count: 'exact', head: true })

      if (countError) throw countError
      setBudgetsCount(budgetCount || 0)

      // Crescita budget nel tempo
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('created_at')
        .order('created_at', { ascending: true })

      if (budgetsError) throw budgetsError

      const growthData = processTimeSeriesData(budgets)
      setBudgetGrowthData(growthData)

      // Top 10 creatori di budget
      // Nota: In una vera applicazione, dovresti controllare qual è l'ID del creatore nei dati del budget
      // Questa è una approssimazione che presuppone che il creatore sia l'utente che ha creato il budget
      const { data: budgetsWithCreators, error: creatorsError } = await supabase
        .from('budgets')
        .select(`
          id,
          created_by:auth.users(id, email)
        `)

      if (creatorsError) throw creatorsError

      const creatorCounts: Record<string, number> = {}
      budgetsWithCreators.forEach(budget => {
        // Utilizzando la relazione con auth.users per ottenere l'email del creatore
        const creator = 'unknown'
        creatorCounts[creator] = (creatorCounts[creator] || 0) + 1
        console.log(budget)
      })

      const creatorsData = Object.entries(creatorCounts)
        .map(([email, count]) => ({ creator_email: email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setTopBudgetCreators(creatorsData)

      // Distribuzione dei creatori
      const usersWithBudgets = Object.keys(creatorCounts).length
      const usersWithoutBudgets = usersCount - usersWithBudgets

      setCreatorDistribution([
        { name: 'Utenti che creano budget', value: usersWithBudgets },
        { name: 'Utenti che non creano budget', value: usersWithoutBudgets > 0 ? usersWithoutBudgets : 0 }
      ])
    } catch (error) {
      console.error('Errore nel caricamento dei budget:', error)
    }
  }

  // Fetch dei dati dei link tra budget e utenti
  const fetchLinkBudgetUsersData = async () => {
    try {
      // Numero totale di link
      const { count: linkCount, error: countError } = await supabase
        .from('link_budget_users')
        .select('id', { count: 'exact', head: true })

      if (countError) throw countError
      setTotalLinks(linkCount || 0)

      // Numero di link senza utente assegnato
      const { count: noUserCount, error: noUserError } = await supabase
        .from('link_budget_users')
        .select('id', { count: 'exact', head: true })
        .is('user_id', null)

      if (noUserError) throw noUserError
      setLinksWithoutUser(noUserCount || 0)

      // Top 10 utenti assegnati per email esterna
      const { data: externalEmails, error: emailsError } = await supabase
        .from('link_budget_users')
        .select('external_email')
        .not('external_email', 'is', null)

      if (emailsError) throw emailsError

      const emailCounts: Record<string, number> = {}
      externalEmails.forEach(link => {
        if (link.external_email) {
          emailCounts[link.external_email] = (emailCounts[link.external_email] || 0) + 1
        }
      })

      const topEmails = Object.entries(emailCounts)
        .map(([email, count]) => ({ external_email: email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setTopAssignedUsers(topEmails)

      // Livello di adozione della funzionalità link_budget_users
      const { data: uniqueUsers, error: uniqueError } = await supabase
        .from('link_budget_users')
        .select('user_id')
        .not('user_id', 'is', null)

      if (uniqueError) throw uniqueError

      const uniqueUserIds = new Set(uniqueUsers.map(link => link.user_id))
      const usersUsingLinks = uniqueUserIds.size
      const usersNotUsingLinks = usersCount - usersUsingLinks

      setLinkUserAdoption([
        { name: 'Utenti che usano link', value: usersUsingLinks },
        { name: 'Utenti che non usano link', value: usersNotUsingLinks > 0 ? usersNotUsingLinks : 0 }
      ])
    } catch (error) {
      console.error('Errore nel caricamento dei link budget-utenti:', error)
    }
  }

  // Funzione per elaborare i dati delle serie temporali in gruppi mensili
  const processTimeSeriesData = (data: { created_at: string }[]): TimeSeriesData[] => {
    const monthlyCounts: Record<string, number> = {}
    
    data.forEach(item => {
      const date = new Date(item.created_at)
      const monthYear = format(date, 'MMM yyyy')
      
      monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1
    })
    
    // Converti in array e aggiungi valori cumulativi
    let cumulativeCount = 0
    return Object.entries(monthlyCounts)
      .map(([date, count]) => {
        cumulativeCount += count
        return { date, count: cumulativeCount }
      })
      .sort((a, b) => {
        // Ordina per data
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
  }

  // Componente per metriche di base
  const BasicMetrics = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usersCount}</div>
          <p className="text-xs text-muted-foreground">
            {userGrowthData.length > 0 && `+${userGrowthData[userGrowthData.length - 1]?.count - (userGrowthData[userGrowthData.length - 2]?.count || 0)} rispetto al mese precedente`}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Totali</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{budgetsCount}</div>
          <p className="text-xs text-muted-foreground">
            {budgetGrowthData.length > 0 && `+${budgetGrowthData[budgetGrowthData.length - 1]?.count - (budgetGrowthData[budgetGrowthData.length - 2]?.count || 0)} rispetto al mese precedente`}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Link Budget-Utenti</CardTitle>
          <Link className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLinks}</div>
          <p className="text-xs text-muted-foreground">
            {budgetsCount > 0 && `${(totalLinks / budgetsCount).toFixed(2)} link per budget in media`}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Link Senza Utente</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{linksWithoutUser}</div>
          <p className="text-xs text-muted-foreground">
            {totalLinks > 0 && `${((linksWithoutUser / totalLinks) * 100).toFixed(2)}% del totale`}
          </p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard Metriche</h1>
          <p className="text-gray-500 mb-4">
            Analisi degli utenti, budget e link della piattaforma
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-xl">Caricamento dati in corso...</p>
        </div>
      ) : (
        <>
          <BasicMetrics />

          <Tabs defaultValue="users">
            <TabsList className="mb-4">
              <TabsTrigger value="users">Utenti</TabsTrigger>
              <TabsTrigger value="budgets">Budget</TabsTrigger>
              <TabsTrigger value="links">Link Budget-Utenti</TabsTrigger>
            </TabsList>

            {/* Tab Utenti */}
            <TabsContent value="users">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Crescita Utenti nel Tempo</CardTitle>
                    <CardDescription>
                      Numero cumulativo di utenti registrati per mese
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={userGrowthData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" name="Utenti Totali" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Budget */}
            <TabsContent value="budgets">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Crescita Budget nel Tempo</CardTitle>
                    <CardDescription>
                      Numero cumulativo di budget creati per mese
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={budgetGrowthData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Budget Totali" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Creatori di Budget</CardTitle>
                    <CardDescription>
                      Utenti che hanno creato più budget
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topBudgetCreators}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="creator_email" 
                          tick={{ fontSize: 12 }}
                          width={90}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Numero di Budget" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuzione Creatori di Budget</CardTitle>
                    <CardDescription>
                      Percentuale di utenti che creano budget rispetto al totale
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={creatorDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {creatorDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Numero di utenti']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Link Budget-Utenti */}
            <TabsContent value="links">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Utenti Assegnati</CardTitle>
                    <CardDescription>
                      Utenti esterni più frequentemente assegnati ai budget
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Frequenza</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topAssignedUsers.map((user, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{user.external_email}</TableCell>
                              <TableCell className="text-right">
                                <Badge>{user.count}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {topAssignedUsers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4">
                                Nessun dato disponibile
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Adozione della Funzionalità Link</CardTitle>
                    <CardDescription>
                      Percentuale di utenti che utilizzano la funzionalità di link
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={linkUserAdoption}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {linkUserAdoption.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Numero di utenti']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}