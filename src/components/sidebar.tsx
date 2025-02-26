'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, User, DatabaseZap, LogOut, Zap, ClipboardList, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import FeedbackDialog from './feedbackDialog/feedbackDialog';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata.user_name);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    // Aggiungi il listener per l'evento di aggiornamento del nome utente
    const handleUserNameUpdate = (e: CustomEvent<string>) => {
      setUserName(e.detail);
    };

    window.addEventListener('userNameUpdated', handleUserNameUpdate as EventListener);
    fetchUserProfile();

    // Cleanup
    return () => {
      window.removeEventListener('userNameUpdated', handleUserNameUpdate as EventListener);
    };
  }, [supabase]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      router.push('/login');
      toast.success('Logout effettuato con successo');
      
    } catch (error) {
      console.error('Errore durante il logout:', error);
      toast.error('Si è verificato un errore durante il logout. Riprova più tardi.');
    }
  };

  const navItems = [
    { 
      name: 'Budget', 
      icon: <Zap className="h-5 w-5" />,  
      href: '/budgets' 
    },
    { 
      name: 'Database', 
      icon: <DatabaseZap className="h-5 w-5" />,  
      href: '/settings' 
    }
  ];

  return (
    <div className={`fixed top-0 left-0 h-screen bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-4 hover:bg-gray-800"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </Button>
        
        <div className={`transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">B) Budgez</h1>
          </div>
          <p className="text-sm text-gray-400">mi mandi un preventivo?</p>
        </div>
      </div>

      <nav className="flex-1 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-2 py-3 my-1 rounded-lg transition-colors
              ${pathname === item.href ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
          >
            <div className="min-w-[24px]">
              {item.icon}
            </div>
            {!isCollapsed && <span className="ml-3">{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4">
        <Button
          onClick={() => window.open('https://tally.so/r/wkJWVR', '_blank')}
          className={`flex items-center rounded-lg transition-colors w-full justify-${isCollapsed ? 'center' : 'start'} animate-pulse`}
        >
          <ClipboardList className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Survey</span>}
        </Button>

        {/* Nuovo bottone per il feedback */}
        <Button 
          onClick={() => setIsFeedbackOpen(true)}
          className={`mt-2 flex items-center rounded-lg transition-colors hover:bg-gray-800 w-full justify-${isCollapsed ? 'center' : 'start'}`}
        >
          <MessageSquare className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Feedback</span>}
        </Button>

        {/* FeedbackDialog controllato dallo stato */}
        <FeedbackDialog 
          open={isFeedbackOpen} 
          onOpenChange={setIsFeedbackOpen} 
        />

        <Button 
          className={`mt-2 flex items-center rounded-lg transition-colors hover:bg-gray-800 w-full justify-${isCollapsed ? 'center' : 'start'}`}
          onClick={() => router.push('/profile')}
        >
          <User className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">{userName}</span>}
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`mt-2 text-red-400 hover:text-red-300 hover:bg-gray-800 w-full flex items-center justify-${isCollapsed ? 'center' : 'start'}`}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;