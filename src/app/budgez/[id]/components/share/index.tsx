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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Budget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-2">Share with team</h3>
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
            <div className="mt-4 space-y-2">
              {sharedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                  <span className="truncate">{user.email}</span>
                  <div className="flex items-center gap-2">
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
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Share with external users</h3>
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">
              Coming soon
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;