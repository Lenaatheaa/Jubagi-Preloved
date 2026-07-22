import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatView } from '@/components/chat/ChatView';

export const metadata = { title: 'Pesan - JUBAGI' };

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-background dark:via-background dark:to-primary/10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-28 pb-6">
        <Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
          <ChatView />
        </Suspense>
      </div>
    </main>
  );
}
