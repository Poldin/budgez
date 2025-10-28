'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Zap, FileText, Download, Globe, Gift } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import Footer from '@/components/footer/footer';

export default function HowToPage() {
  const [language, setLanguage] = useState<Language>('it');
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">B) Budgez</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.location.href = '/'}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.backToApp}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
              {t.howItWorksTitle}
            </h1>
            <p className="text-xl text-gray-600">
              {t.howItWorksSubtitle}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-16">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <span>{t.step1Title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 ml-11">{t.step1Desc}</p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <span>{t.step2Title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 ml-11">{t.step2Desc}</p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <span>{t.step3Title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 ml-11">{t.step3Desc}</p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <span>{t.step4Title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 ml-11">{t.step4Desc}</p>
              </CardContent>
            </Card>

            {/* Step 5 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                    5
                  </div>
                  <span>{t.step5Title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 ml-11">{t.step5Desc}</p>
              </CardContent>
            </Card>

            {/* Step 6 - Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                    6
                  </div>
                  <span>{t.step6Title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 ml-11">{t.step6Desc}</p>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">{t.features}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{t.feature1}</h3>
                  <p className="text-sm text-gray-600">{t.feature1Desc}</p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{t.feature2}</h3>
                  <p className="text-sm text-gray-600">{t.feature2Desc}</p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Download className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{t.feature3}</h3>
                  <p className="text-sm text-gray-600">{t.feature3Desc}</p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{t.feature4}</h3>
                  <p className="text-sm text-gray-600">{t.feature4Desc}</p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{t.feature5}</h3>
                  <p className="text-sm text-gray-600">{t.feature5Desc}</p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{t.feature6}</h3>
                  <p className="text-sm text-gray-600">{t.feature6Desc}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/'}
              className="text-lg px-8 py-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t.backToApp}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer language={language} onLanguageChange={setLanguage} />
    </div>
  );
}
