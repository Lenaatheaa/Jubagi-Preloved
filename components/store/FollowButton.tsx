'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: number;
  initialFollowing: boolean;
  followerCount: number;
}

export function FollowButton({ targetUserId, initialFollowing, followerCount: initialCount }: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!session) {
      alert('Kamu harus login untuk mengikuti toko ini.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setIsFollowing(data.following);
        setFollowerCount(prev => data.following ? prev + 1 : prev - 1);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-center mb-2">
        <p className="text-2xl font-black text-foreground">{followerCount}</p>
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pengikut</p>
      </div>
      <button 
        onClick={handleFollow}
        disabled={loading}
        className={`px-6 py-2 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 w-full md:w-auto min-w-[140px] ${
          isFollowing 
            ? 'bg-muted text-foreground border border-border hover:bg-red-50 hover:text-red-500 hover:border-red-200' 
            : 'bg-primary text-white hover:bg-primary/90'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <span className="group-hover:hidden flex items-center gap-1.5"><CheckIcon className="w-4 h-4" /> Mengikuti</span>
            <span className="hidden group-hover:flex items-center gap-1.5"><UserMinus className="w-4 h-4" /> Batal Ikuti</span>
          </>
        ) : (
          <><UserPlus className="w-4 h-4" /> Ikuti Toko</>
        )}
      </button>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
}
