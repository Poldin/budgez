import React, { useState } from 'react';
import { Plus, Share, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface SharedUser {
  email: string;
  role: 'editor' | 'viewer';
  id: string;
}

const ShareDialog = () => {
  const [email, setEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email) {
      addUser();
    }
  };

  const addUser = () => {
    if (!email || !email.includes('@')) return;
    
    const newUser: SharedUser = {
      email,
      role: 'viewer',
      id: Math.random().toString(36).substr(2, 9)
    };
    
    setSharedUsers([...sharedUsers, newUser]);
    setEmail('');
  };

  const updateUserRole = (userId: string, newRole: 'editor' | 'viewer') => {
    setSharedUsers(sharedUsers.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const removeUser = (userId: string) => {
    setSharedUsers(sharedUsers.filter(user => user.id !== userId));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-gray-800">
          <Share className="h-4 w-4 mr-2" /> Share
        </Button>
      </DialogTrigger>
      <DialogHeader><DialogTitle></DialogTitle></DialogHeader>
      <DialogContent className="min-w-[50vw] min-h-[50vh]">
        <Tabs defaultValue="internal">
          <TabsList className=" grid-cols-2">
            <TabsTrigger value="internal" className='data-[state=active]:bg-black data-[state=active]:text-white'>Interna</TabsTrigger>
            <TabsTrigger value="external" className='data-[state=active]:bg-black data-[state=active]:text-white'>External</TabsTrigger>
          </TabsList>
          
          <TabsContent value="internal" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-xl">Collabora</h3>
              <p className="text-gray-400">condividi il budgez internamente per rifinirlo al meglio [inviamo una mail di invito a collaborare!]</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={addUser}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {sharedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-gray-50 rounded">
                  <span className="truncate">{user.email}</span>
                  <div className="flex items-center">
                    <Select
                      value={user.role}
                      onValueChange={(value: 'editor' | 'viewer') => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeUser(user.id)}>
                      <Trash2 className="h-4 w-4 text-black" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="external">
            <div>
              <h3 className="font-semibold mb-2 text-xl">Condividi con esterni</h3>
              <p className="text-gray-400">ready to sell? Inviamo il documento External alle mail che ci indicherai</p>
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">
                Coming soon
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;