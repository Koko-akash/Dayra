import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../../assets/Dayra_Main_Logo.png'
import api from '../../api/axios'

interface Message {
  id: number
  text: string
  sender: 'buddy' | 'user'
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

const welcomeMessage: Message = {
  id: 0,
  sender: 'buddy',
  text: "Hey boss, I'm your buddy!! 🔥\nI'm here to give you company, talk and most importantly listen to you."
}

const Buddy = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingChatTitle, setEditingChatTitle] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgCount = useRef(1)

  const activeConversation = conversations.find((c) => c.id === activeChatId)
  const messages = activeConversation?.messages || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await api.get('/api/buddy/conversations')
      if (response.data.conversations.length === 0) {
        await createNewChat()
      } else {
        const convs = response.data.conversations.map((c: any) => ({
          id: c.id,
          title: c.title,
          messages: []
        }))
        setConversations(convs)
        setActiveChatId(convs[0].id)
        // Load messages for first conversation
        const msgResponse = await api.get(`/api/buddy/conversation/${convs[0].id}`)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convs[0].id
              ? {
                  ...c, messages: msgResponse.data.messages.map((m: any, i: number) => ({
                    id: i,
                    sender: m.sender,
                    text: m.text
                  }))
                }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Failed to load conversations', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewChat = async () => {
    try {
      const response = await api.post('/api/buddy/new', {
        title: 'New Conversation'
      })
      const convId = response.data.conversation_id
      const newChat: Conversation = {
        id: convId,
        title: 'New Conversation',
        messages: [{ ...welcomeMessage, id: msgCount.current++ }]
      }
      setConversations((prev) => [newChat, ...prev])
      setActiveChatId(convId)
      setSidebarOpen(false)
    } catch (error) {
      console.error('Failed to create conversation', error)
    }
  }

  const handleNewChat = async () => {
    await createNewChat()
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !activeChatId) return

    const userMsg: Message = { id: msgCount.current++, sender: 'user', text }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              title: c.title === 'New Conversation' ? text.slice(0, 30) : c.title,
              messages: [...c.messages, userMsg]
            }
          : c
      )
    )
    setInput('')
    setIsTyping(true)

    try {
      const response = await api.post('/api/buddy/chat', {
        message: text,
        conversation_id: activeChatId
      })
      const buddyMsg: Message = {
        id: msgCount.current++,
        sender: 'buddy',
        text: response.data.reply
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, buddyMsg] }
            : c
        )
      )
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send message!')
    } finally {
      setIsTyping(false)
    }
  }

  const handleDeleteChat = async (id: string) => {
    try {
      await api.delete(`/api/buddy/conversation/${id}`)
      const remaining = conversations.filter((c) => c.id !== id)
      if (remaining.length === 0) {
        await createNewChat()
        return
      }
      setConversations(remaining)
      if (activeChatId === id) setActiveChatId(remaining[0].id)
    } catch (error) {
      console.error('Failed to delete conversation', error)
    }
  }

  const handleSelectConversation = async (id: string) => {
    setActiveChatId(id)
    setSidebarOpen(false)
    // Load messages if not already loaded
    const conv = conversations.find((c) => c.id === id)
    if (conv && conv.messages.length === 0) {
      try {
        const response = await api.get(`/api/buddy/conversation/${id}`)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c, messages: response.data.messages.map((m: any, i: number) => ({
                    id: i,
                    sender: m.sender,
                    text: m.text
                  }))
                }
              : c
          )
        )
      } catch (error) {
        console.error('Failed to load messages', error)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#90EE90' }}>
      <p className="text-gray-700 font-medium animate-pulse">Loading Buddy... 🤖</p>
    </div>
  )

  return (
    <div
      className="h-screen w-full flex flex-col p-4 sm:p-6 relative overflow-hidden"
      style={{ backgroundColor: '#90EE90' }}
    >

      {/* SIDEBAR BACKDROP */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SLIDING SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 h-full z-50 w-64 sm:w-72 flex flex-col shadow-xl"
            style={{ backgroundColor: '#FAF7F2' }}
          >
            {/* SIDEBAR HEADER */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#C8E6C9' }}>
              <h2 className="font-bold text-gray-800 text-base sm:text-lg">Chat History</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* NEW CHAT BUTTON */}
            <div className="p-3">
              <button
                onClick={handleNewChat}
                className="w-full py-2.5 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#4A9B6F' }}
              >
                <span className="text-lg">+</span> New Chat
              </button>
            </div>

            {/* CONVERSATION LIST */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 px-2 pb-4">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group transition-colors ${
                    c.id === activeChatId ? 'bg-green-100' : 'hover:bg-green-50'
                  }`}
                  onClick={() => {
                    if (editingChatId === c.id) return
                    handleSelectConversation(c.id)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base">💬</span>
                    {editingChatId === c.id ? (
                      <input
                        autoFocus
                        value={editingChatTitle}
                        onChange={(e) => setEditingChatTitle(e.target.value)}
                        onBlur={async () => {
                          await api.put(`/api/buddy/conversation/${c.id}/rename`, { title: editingChatTitle.trim() || c.title })
                          setConversations((prev) =>
                            prev.map((x) =>
                              x.id === c.id ? { ...x, title: editingChatTitle.trim() || x.title } : x
                            )
                          )
                          setEditingChatId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setConversations((prev) =>
                              prev.map((x) =>
                                x.id === c.id ? { ...x, title: editingChatTitle.trim() || x.title } : x
                              )
                            )
                            setEditingChatId(null)
                          }
                          if (e.key === 'Escape') setEditingChatId(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-gray-700 bg-transparent outline-none border-b border-green-400 w-full"
                      />
                    ) : (
                      <span
                        className="text-sm text-gray-700 truncate"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setEditingChatId(c.id)
                          setEditingChatTitle(c.title)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title="Double click to rename"
                      >
                        {c.title}
                      </span>
                    )}
                  </div>
                  {/* DELETE */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteChat(c.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAV */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/home')}
            className="text-gray-700 hover:text-gray-900 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 hover:text-gray-900 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Buddy</h1>
        <img src={logo} alt="Dayra" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
      </div>

      {/* CHAT AREA */}
      <div
        className="flex-1 rounded-3xl flex flex-col overflow-hidden shadow-sm"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className="max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-gray-800 text-sm sm:text-base whitespace-pre-line"
                style={{
                  backgroundColor: msg.sender === 'buddy' ? '#FAF7F2' : '#F0FFF0',
                  border: msg.sender === 'buddy' ? '1.5px solid #4A9B6F' : 'none',
                  borderRadius: msg.sender === 'buddy' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <span className="text-xs mt-1 mr-1" style={{ color: '#4A9B6F' }}>✓✓</span>
              )}
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex items-start">
              <div
                className="px-4 py-3 rounded-2xl text-sm"
                style={{ backgroundColor: '#FAF7F2', border: '1.5px solid #4A9B6F', borderRadius: '4px 16px 16px 16px' }}
              >
                <div className="flex gap-1 items-center h-5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#4A9B6F', animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-3 sm:p-4">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ borderColor: '#4A9B6F', backgroundColor: '#FAF7F2' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type something..."
              className="flex-1 outline-none bg-transparent text-gray-700 text-sm sm:text-base"
            />
            <button
              onClick={handleSend}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-80"
              style={{ color: '#4A9B6F' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Buddy