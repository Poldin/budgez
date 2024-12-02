'use client'

import { useState } from 'react'
import { Zap, ArrowRight, Bolt, Share2, ChartBar, Bell, Eye, Shield, Lock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LandingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

  const features = [
    { title: 'Generazione Rapida', description: 'Crea preventivi professionali in pochi minuti', icon: Bolt },
    { title: 'Condivisione Smart', description: 'Condividi facilmente con i tuoi clienti', icon: Share2 },
    { title: 'Monitoraggio Completo', description: 'Tieni traccia di stati e conversioni', icon: ChartBar }
  ]

  const benefits = [
    { title: 'Reminder Automatici', description: 'Mai più follow-up dimenticati', icon: Bell },
    { title: 'Tracking Visualizzazioni', description: 'Monitora l\'interesse dei clienti', icon: Eye },
    { title: 'Notifiche Multiple', description: 'Email e Slack integrati', icon: Zap },
    { title: 'Sicurezza Garantita', description: 'I tuoi dati sono al sicuro', icon: Shield }
  ]

  const plans = [
    {
      name: 'Zero.',
      price: { monthly: 0, yearly: 0 },
      features: ['5 preventivi/mese', 'Template base', 'Reminder email']
    },
    {
      name: 'Little :|',
      price: { monthly: 6.99, yearly: 6.99 * 0.8 },
      features: ['Preventivi illimitati', 'Template personalizzati', 'Integrazione Slack', 'Analytics base']
    },
    {
      name: 'ALot!',
      price: { monthly: 149.99, yearly: 149.99 * 0.8 },
      perUser: { monthly: 6.99, yearly: 6.99 * 0.8 },
      features: ['Tutto di Team', 'API access', 'SSO', 'Analytics avanzato']
    }
  ]

  return (
    <div className="min-h-screen">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Budgez</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost">Accedi</Button>
            <Button>Registrati</Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4">
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className='space-y-4'>
              <h1 className="text-5xl font-bold text-gray-800">
                Mi mandi un preventivo?
              </h1>
              <h1 className="text-2xl leading-tight mb-6 text-gray-800">
                crea, gestisci e monitora i tuoi preventivi
              </h1>
              <Button size="lg" className="mt-8">
                Inizia subito <ArrowRight className="ml-2" />
              </Button>
            </div>
            <div className="relative">
              <img src="https://img.freepik.com/foto-premium/persona-felice-che-tiene-uno-smartphone-e-festeggia-isolato-uomo-eccitato-che-vince-un-premio-dal-suo-cellulare-uomo-bello-eccitato-che-guarda-lo-smartphone-che-celebra-qualcosa_550253-1933.jpg" alt="Dashboard" className="rounded-lg shadow-xl" />
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="p-6">
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6">
                <benefit.icon className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-blue-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Soluzione Enterprise</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Hai esigenze specifiche? Scopri i nostri piani personalizzati per grandi team.
                </p>
                <Button variant="outline">Contattaci</Button>
              </div>
              <div>
                <img src="/api/placeholder/500/300" alt="Enterprise" className="rounded-lg shadow-lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <Tabs value={billingInterval} onValueChange={(v) => setBillingInterval(v as 'monthly' | 'yearly')} className="mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="monthly">Mensile</TabsTrigger>
              <TabsTrigger value="yearly">Annuale (-20%)</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold">
                    €{plan.price[billingInterval].toFixed(2)}
                  </span>
                  {plan.perUser && (
                    <div className="text-sm text-gray-600 mt-1">
                      + €{plan.perUser[billingInterval].toFixed(2)}/utente
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Lock className="h-4 w-4 text-blue-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={index === 1 ? "default" : "outline"}>
                  {plan.name === 'Enterprise' ? 'Contattaci' : 'Inizia ora'}
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Pronti a vendere di più?</h2>
            <Button size="lg" variant="secondary">
              Inizia gratuitamente
            </Button>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © 2024 Budgez. Tutti i diritti riservati.
          </div>
          <div className="space-x-4 text-sm">
            <a href="#" className="text-gray-600 hover:text-blue-600">Privacy</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">Termini</a>
          </div>
        </div>
      </footer>
    </div>
  )
}