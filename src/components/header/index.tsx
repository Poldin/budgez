'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

const Header = () => {
  const router = useRouter();


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div 
                className="flex items-center space-x-2 cursor-pointer" 
                onClick={() => router.push('/')}
              >
                {/* <Zap className="h-6 w-6 text-blue-600" /> */}
                <span className="text-lg font-bold">B) Budgez</span>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <a href="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  About us
                </a>
                <a href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Pricing
                </a>
              </nav>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/login')}>
                Accedi
              </Button>
              <Button variant="default" onClick={() => router.push('/login')} className="font-bold">
                Inizia gratis
              </Button>
            </div>
          </div>
        </div>
      </header>


    </>
  );
};

export default Header;