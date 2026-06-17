'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Message = {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
}

function Avatar({ user }: { user: Message['user'] }) {
  const initials = (user.name ?? '?').slice(0, 2).toUpperCase()
  if (user.image) {
    return <img src={user.image} alt={user.name ?? ''} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-yellow-400">
      {initials}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatWidget() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat')
      if (!res.ok) return
      const data: Message[] = await res.json()
      setMessages(prev => {
        const lastPrev = prev[prev.length - 1]?.id
        const lastNew = data[data.length - 1]?.id
        if (lastNew && lastNew !== lastPrev) {
          if (!open) setUnread(u => u + 1)
          lastIdRef.current = lastNew
        }
        return data
      })
    } catch {}
  }, [open])

  // Poll every 3s when open, every 10s when closed
  useEffect(() => {
    fetchMessages()
    const interval = open ? 3000 : 10000
    pollRef.current = setInterval(fetchMessages, interval)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open, fetchMessages])

  // Scroll to bottom when messages change and chat is open
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleOpen = () => {
    setOpen(true)
    setUnread(0)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const msg: Message = await res.json()
        setMessages(prev => [...prev.slice(-59), msg])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
      {/* Chat panel */}
      {open && (
        <div className="mb-3 w-80 sm:w-96 flex flex-col glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          style={{ height: '460px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-navy-900/80 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-display text-sm tracking-wider text-white">GLOBAL CHAT</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {messages.length === 0 && (
              <p className="text-center text-slate-600 text-xs mt-8">No messages yet — say hello!</p>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.user.id === session?.user?.id
              const showAvatar = !isOwn && (i === 0 || messages[i - 1].user.id !== msg.user.id)
              const showName = !isOwn && (i === 0 || messages[i - 1].user.id !== msg.user.id)
              return (
                <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                  {!isOwn && (
                    <div className="w-7 flex-shrink-0 mt-auto">
                      {showAvatar && <Avatar user={msg.user} />}
                    </div>
                  )}
                  <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
                    {showName && (
                      <span className="text-[10px] font-mono text-slate-500 px-1">{msg.user.name ?? 'Unknown'}</span>
                    )}
                    <div className={cn(
                      'px-3 py-2 rounded-2xl text-sm leading-relaxed break-words',
                      isOwn
                        ? 'bg-yellow-400/20 text-yellow-50 rounded-tr-sm'
                        : 'bg-white/5 text-slate-200 rounded-tl-sm'
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-white/5 p-3">
            {session ? (
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  maxLength={200}
                  placeholder="Say something…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/40 transition-colors"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/20 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/30 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500">
                <Link href="/login" className="text-yellow-400 hover:underline">Sign in</Link> to chat
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="w-13 h-13 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black shadow-gold-glow flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative"
        style={{ width: 52, height: 52 }}
        aria-label="Toggle chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
