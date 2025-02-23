'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import SalesTeamDialog from '@/components/sales_dialog/salesteamdialog';

type HandleMenuItemClickFunction = () => void;

const Header: React.FC = () => {
  const router = useRouter();
  const [showDemoDialog, setShowDemoDialog] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleDemoRequest = (): void => {
    setShowDemoDialog(true);
    setIsMenuOpen(false);
  };

  const handleMenuItemClick = (action: HandleMenuItemClickFunction): void => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => router.push('/')}
            >
              <span className="text-lg font-bold">B) Budgez</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                About
              </a>
              <a href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Pricing
              </a>
              <Button variant="ghost" onClick={handleDemoRequest}>
                Richiedi una demo
              </Button>
              <Button variant="ghost" onClick={() => router.push('/login')}>
                Accedi
              </Button>
              <Button variant="default" onClick={() => router.push('/login')} className="font-bold">
                Inizia gratis
              </Button>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 md:hidden">
              <Button variant="default" onClick={() => router.push('/login')} className="font-bold">
                Inizia gratis
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="flex flex-col space-y-4 px-4 py-6 bg-white border-t border-gray-200">
                <a 
                  href="/about" 
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </a>
                <a 
                  href="/pricing" 
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <Button 
                  variant="ghost" 
                  onClick={() => handleMenuItemClick(handleDemoRequest)}
                  className="justify-start px-0"
                >
                  Richiedi una demo
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleMenuItemClick(() => router.push('/login'))}
                  className="justify-start px-0"
                >
                  Accedi
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Demo Request Dialog */}
      <SalesTeamDialog 
        open={showDemoDialog}
        onOpenChange={setShowDemoDialog}
      />
    </>
  );
};

export default Header;