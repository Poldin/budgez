'use client'

import React from 'react'
import { Card } from "@/components/ui/card"

export default function SetSettings() {
  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-8">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <p className="text-xl font-medium text-gray-800">
              Calma e sangue freddo, sto lavorando perché budget sia sempre più facile da usare
            </p>
            <p className="text-gray-600">
              #stay #fresh #stay #vetto
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}