'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Send, MessageCircle, Loader2, ChevronLeft,
  DollarSign, CheckCircle, X, Gift, ShoppingBag
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sendLocalPushNotification } from '@/components/providers/PushNotificationProvider';

interface ChatRoom {
  id: number;
  product_id: number;
  buyer_id: number;
  seller_id: number;
  buyer_email: string;
  seller_email: string;
  product_title: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  sender_email: string;
  message: string;
  message_type: 'text' | 'offer';
  offer_amount: number | null;
  created_at: string;
}

export function ChatView() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contextProduct, setContextProduct] = useState<{id: string, title: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch rooms list
  useEffect(() => {
    if (!session?.user?.email) return;

    const loadRooms = async () => {
      setLoadingRooms(true);
      const res = await fetch('/api/chat/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
      setCurrentUserId(data.currentUserId);
      setLoadingRooms(false);
    };

    loadRooms();
  }, [session]);

  // Handle incoming from product page: ?sellerId=X&productId=Y or ?roomId=Z
  useEffect(() => {
    if (!session?.user?.email) return;

    const sellerId = searchParams.get('sellerId');
    const productId = searchParams.get('productId');
    const roomId = searchParams.get('roomId');
    const initialMessage = searchParams.get('initialMessage');

    if (initialMessage) {
      setNewMessage(prev => prev ? prev : initialMessage);
    }

    if (roomId) {
      // Direct room opening
      const found = rooms.find(r => r.id === parseInt(roomId));
      if (found) {
        setActiveRoom(found);
      } else {
        // Room might not be loaded yet, fetch it
        supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', parseInt(roomId))
          .single()
          .then(({ data }) => {
            if (data) {
              setActiveRoom(data);
              setRooms(prev => [data, ...prev.filter(r => r.id !== data.id)]);
            }
          });
      }
    } else if (productId && sellerId) {
      // Create or find room
      fetch(`/api/chat/rooms?productId=${productId}&sellerId=${sellerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.room) {
            setActiveRoom(data.room);
            setRooms(prev => {
              const exists = prev.find(r => r.id === data.room.id);
              return exists ? prev : [data.room, ...prev];
            });
            const productTitle = searchParams.get('productTitle');
            if (productTitle) {
               setContextProduct({ id: productId, title: productTitle });
            }
          }
        });
    }
  }, [searchParams, session, rooms.length]);

  // Load messages when room changes + setup realtime subscription + presence
  useEffect(() => {
    if (!activeRoom || !currentUserId) return;

    setLoadingMessages(true);
    setMessages([]);
    setIsOtherOnline(false);

    fetch(`/api/chat/messages?roomId=${activeRoom.id}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setLoadingMessages(false);
      });

    const otherUserId = activeRoom.buyer_id === currentUserId
      ? activeRoom.seller_id
      : activeRoom.buyer_id;

    // Subscribe to new messages in real-time
    const msgChannel = supabase
      .channel(`room-${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== currentUserId) {
            sendLocalPushNotification(`Pesan Baru dari ${newMsg.sender_name}`, {
              body: newMsg.message_type === 'offer' ? 'Memberikan Penawaran Harga!' : newMsg.message
            });
          }
        }
      )
      .subscribe();

    // Presence: track current user and watch for other user
    const presenceChannel = supabase.channel(`presence-room-${activeRoom.id}`, {
      config: { presence: { key: `user-${currentUserId}` } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineKeys = Object.keys(state);
        const otherIsOnline = onlineKeys.some(key => key === `user-${otherUserId}`);
        setIsOtherOnline(otherIsOnline);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === `user-${otherUserId}`) setIsOtherOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === `user-${otherUserId}`) setIsOtherOnline(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(msgChannel);
      presenceChannel.untrack().then(() => supabase.removeChannel(presenceChannel));
    };
  }, [activeRoom?.id, currentUserId]);

  // Dedicated Auto-send Context Effect
  useEffect(() => {
    if (!activeRoom || !currentUserId || loadingMessages || sending) return;

    const pId = searchParams.get('productId');
    const pTitle = searchParams.get('productTitle');
    
    // Only trigger if we explicitly came from a product link (URL has productId)
    if (pId && pTitle) {
       setSending(true);
       const text = 'Halo, mengenai produk ini...';
       const fullText = `[PRODUK:${pId}:${pTitle}]\n${text}`;
       
       const optimisticMsg: ChatMessage = {
         id: Date.now(),
         room_id: activeRoom.id,
         sender_id: currentUserId,
         sender_name: session?.user?.name || session?.user?.email?.split('@')[0] || 'Saya',
         sender_email: session?.user?.email || '',
         message: fullText,
         message_type: 'text',
         offer_amount: null,
         created_at: new Date().toISOString(),
       };
       
       setMessages(prev => [...prev, optimisticMsg]);
       
       fetch('/api/chat/messages', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           roomId: activeRoom.id,
           message: fullText,
           senderId: currentUserId,
           senderName: session?.user?.name || session?.user?.email?.split('@')[0],
           messageType: 'text',
         })
       }).finally(() => {
         setSending(false);
         // Clean up URL so it doesn't re-send on page refresh
         router.replace(`/chat?roomId=${activeRoom.id}`);
       });
    } else if (messages.length === 0 && activeRoom.product_id && activeRoom.product_title) {
       // Fallback for truly empty rooms opened without URL params (e.g., from sidebar)
       setSending(true);
       const text = 'Halo, mengenai produk ini...';
       const fullText = `[PRODUK:${activeRoom.product_id}:${activeRoom.product_title}]\n${text}`;
       
       const optimisticMsg: ChatMessage = {
         id: Date.now(),
         room_id: activeRoom.id,
         sender_id: currentUserId,
         sender_name: session?.user?.name || session?.user?.email?.split('@')[0] || 'Saya',
         sender_email: session?.user?.email || '',
         message: fullText,
         message_type: 'text',
         offer_amount: null,
         created_at: new Date().toISOString(),
       };
       
       setMessages([optimisticMsg]);
       
       fetch('/api/chat/messages', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           roomId: activeRoom.id,
           message: fullText,
           senderId: currentUserId,
           senderName: session?.user?.name || session?.user?.email?.split('@')[0],
           messageType: 'text',
         })
       }).finally(() => {
         setSending(false);
       });
    }
  }, [messages.length, loadingMessages, activeRoom?.id, currentUserId, searchParams, router]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !currentUserId || sending) return;
    setSending(true);
    let text = newMessage.trim();
    if (contextProduct) {
       text = `[PRODUK:${contextProduct.id}:${contextProduct.title}]\n${text}`;
       setContextProduct(null);
    }
    setNewMessage('');

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: Date.now(), // temporary ID
      room_id: activeRoom.id,
      sender_id: currentUserId,
      sender_name: session?.user?.name || session?.user?.email?.split('@')[0] || 'Saya',
      sender_email: session?.user?.email || '',
      message: text,
      message_type: 'text',
      offer_amount: null,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          message: text,
          senderId: currentUserId,
          senderName: session?.user?.name || session?.user?.email?.split('@')[0],
          messageType: 'text',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal mengirim pesan');
      }
    } catch (err: any) {
      console.error("Chat Send Error:", err);
      alert("Pesan gagal terkirim: " + err.message + "\n(Pastikan Supabase RLS untuk tabel chat_messages di-disable atau izinkan Insert public)");
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleAcceptOffer = async (msg: ChatMessage) => {
    try {
      let productId = '';
      if (msg.message.startsWith('[PRODUK:')) {
         const endIdx = msg.message.indexOf(']');
         if (endIdx > -1) {
            productId = msg.message.substring(8, endIdx).split(':')[0];
         }
      }
      
      if (!productId) {
         alert('Gagal mengekstrak ID Produk dari pesan penawaran.');
         return;
      }

      const res = await fetch('/api/offers/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom?.id,
          offerAmount: msg.offer_amount,
          productId: parseInt(productId),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menerima tawaran');
      }

      alert('Tawaran berhasil diterima! Pembeli akan segera diberitahu.');
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    return (
      room.product_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.buyer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.seller_email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getOtherParty = (room: ChatRoom) => {
    if (!currentUserId) return { email: room.seller_email, role: 'Penjual' };
    const isBuyer = room.buyer_id === currentUserId;
    return {
      email: isBuyer ? room.seller_email : room.buyer_email,
      role: isBuyer ? 'Penjual' : 'Pembeli',
    };
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card rounded-3xl shadow-md border border-border overflow-hidden">

      {/* -- Sidebar: Room List -- */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-black text-foreground mb-3">Pesan</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted rounded-xl text-sm border border-border focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="text-5xl mb-4"></div>
              <p className="font-bold text-muted-foreground">Belum ada percakapan</p>
              <p className="text-sm text-muted-foreground mt-1">Mulai chat dengan penjual dari halaman produk!</p>
            </div>
          ) : (
            filteredRooms.map(room => {
              const other = getOtherParty(room);
              const initial = other.email.charAt(0).toUpperCase();
              const isActive = activeRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors text-left border-b border-gray-50 ${isActive ? 'bg-pink-50 border-l-2 border-l-primary' : ''}`}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-200 to-primary flex items-center justify-center text-white font-bold shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-sm text-foreground truncate">{other.email.split('@')[0]}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{formatTime(room.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{other.role}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* -- Main: Chat Area -- */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <button
              onClick={() => setActiveRoom(null)}
              className="lg:hidden p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-primary flex items-center justify-center text-white font-bold shrink-0">
              {getOtherParty(activeRoom).email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{getOtherParty(activeRoom).email.split('@')[0]}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isOtherOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`text-xs font-medium ${isOtherOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {isOtherOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-muted-foreground font-medium text-sm">Belum ada pesan</p>
                <p className="text-muted-foreground text-xs mt-1">Mulai percakapan sekarang!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender_id === currentUserId;
                const isOffer = msg.message_type === 'offer';

                if (isOffer) {
                  let offerProductTitle = 'Produk';
                  let offerProductId = '';
                  let rawDisplayMsg = msg.message;

                  if (rawDisplayMsg.startsWith('[PRODUK:')) {
                     const endIdx = rawDisplayMsg.indexOf(']');
                     if (endIdx > -1) {
                        const tag = rawDisplayMsg.substring(8, endIdx); // "id:title"
                        const [pId, ...pTitleArr] = tag.split(':');
                        offerProductId = pId;
                        offerProductTitle = pTitleArr.join(':');
                     }
                  }
                  
                  const isAccepted = rawDisplayMsg.includes('DITERIMA');

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%] w-72">
                        <div className={`rounded-2xl overflow-hidden border-2 shadow-sm ${isMe ? 'border-primary/30' : 'border-amber-200'}`}>
                          {/* Header label */}
                          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 ${isMe ? 'bg-primary/10 text-primary' : 'bg-amber-50 text-amber-700'}`}>
                            <span className="font-extrabold text-[10px]">Rp</span>
                            {isMe ? 'Kamu menawar' : `${msg.sender_name} menawar`}
                          </div>

                          {/* Product info from room */}
                          <div className="bg-muted px-4 py-2 flex items-center gap-3 border-b border-border">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground font-medium">Barang yang ditawar:</p>
                              <p className="text-sm font-bold text-foreground truncate">{offerProductTitle}</p>
                            </div>
                          </div>

                          {/* Offer price */}
                          <div className="bg-card px-4 py-3">
                            <p className="text-xs text-muted-foreground mb-1">Harga penawaran</p>
                            <p className="text-2xl font-black text-foreground">
                              Rp {msg.offer_amount?.toLocaleString('id-ID')}
                            </p>
                            {!isMe && (
                              <div className="mt-3 flex gap-2">
                                <button onClick={() => handleAcceptOffer(msg)} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Terima
                                </button>
                                <button className="flex-1 py-2 bg-muted hover:bg-gray-200 text-foreground text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1">
                                  <X className="w-3.5 h-3.5" /> Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs mt-1 text-muted-foreground ${isMe ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                }

                let displayMsg = msg.message;
                let productCard = null;

                if (displayMsg.startsWith('[PRODUK:')) {
                   const endIdx = displayMsg.indexOf(']');
                   if (endIdx > -1) {
                      const tag = displayMsg.substring(8, endIdx); // "id:title"
                      const [pId, ...pTitleArr] = tag.split(':');
                       const pTitle = pTitleArr.join(':');
                      productCard = (
                         <div data-pid={pId} className="bg-card/90 border border-border rounded-xl p-2.5 mb-2 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-muted transition-colors" onClick={() => router.push(`/products/${pId}`)}>
                            <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center shrink-0">
                               <ShoppingBag className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Terkait Produk</p>
                               <p className="text-sm font-bold text-foreground truncate">{pTitle}</p>
                            </div>
                         </div>
                      );
                      displayMsg = displayMsg.substring(endIdx + 1).trim();
                   }
                }
                
                let checkoutButton = null;
                if (!isMe && displayMsg.includes('DITERIMA!') && displayMsg.includes('Bayar Sekarang')) {
                    // Extract offerPrice from message: "Tawaran Rp 150.000 DITERIMA" -> 150000
                    const priceMatch = displayMsg.match(/Rp\s*([\d\.]+)/);
                    if (priceMatch && productCard) {
                        const amount = parseInt(priceMatch[1].replace(/\./g, ''));
                        const pId = productCard.props['data-pid']; // extracted via data-pid
                        checkoutButton = (
                            <button 
                                onClick={() => router.push(`/checkout/${pId}?offerPrice=${amount}`)}
                                className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                            >
                                <ShoppingBag className="w-4 h-4" /> Bayar Sekarang
                            </button>
                        );
                    }
                } else if (!isMe && displayMsg.includes('Pengajuan Hibah DITERIMA!') && displayMsg.includes('Checkout Sekarang')) {
                    if (productCard) {
                        const pId = productCard.props['data-pid']; // extracted via data-pid
                        checkoutButton = (
                            <button 
                                onClick={() => router.push(`/checkout/${pId}`)}
                                className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                            >
                                <ShoppingBag className="w-4 h-4" /> Checkout Pengiriman
                            </button>
                        );
                    }
                }


                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      {!isMe && (
                        <p className="text-xs text-muted-foreground font-medium mb-1 ml-1">{msg.sender_name}</p>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                      }`}>
                        {productCard}
                        <p className="whitespace-pre-wrap">{displayMsg}</p>
                        {checkoutButton}
                        <p className={`text-xs mt-1 text-right ${isMe ? 'text-pink-100' : 'text-muted-foreground'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border flex flex-col gap-2 relative">
            {contextProduct && (
               <div className="absolute -top-12 left-4 right-4 bg-muted/90 backdrop-blur-sm border border-border rounded-xl p-2 flex items-center justify-between shadow-sm z-10 animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2 min-w-0">
                    <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-xs font-medium text-foreground truncate">Terkait Produk: <span className="font-bold">{contextProduct.title}</span></p>
                 </div>
                 <button onClick={() => setContextProduct(null)} className="p-1 hover:bg-gray-200 rounded-md">
                   <X className="w-3.5 h-3.5 text-muted-foreground" />
                 </button>
               </div>
            )}
            <div className="flex items-center gap-3 bg-muted rounded-2xl border border-border focus-within:border-primary focus-within:bg-card transition-all px-4 py-2">
              <input
                type="text"
                placeholder="Tulis pesan..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 transition-colors shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-black text-xl text-foreground">Pilih Percakapan</h3>
          <p className="text-muted-foreground mt-2 text-sm">Klik chat di sebelah kiri, atau mulai chat dari halaman produk</p>
        </div>
      )}
    </div>
  );
}
