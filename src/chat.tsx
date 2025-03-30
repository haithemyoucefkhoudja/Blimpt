'use client'

import { Message, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea} from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {  PaperclipIcon, BrainCircuitIcon, SearchIcon, ArrowUpIcon, Badge } from 'lucide-react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from './sidebar'

const deepseekChat = createOpenAI({
    baseURL:'https://api.deepseek.com',
    apiKey:'sk-cdf08fabb1324e6485e59caa75daf8fb',
    name:'deepseek-chat'
})
import { listen } from '@tauri-apps/api/event';

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  useEffect(() => { 
    listen('transfer-data', (event) => {
    setMessages(prev => [...prev, event.payload as Message])
    });
  }, [
    
  ])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)

    try {
      let assistantMessage = ''
      const result = streamText({
          model: deepseekChat('deepseek-chat' as any, {
          }),
          messages: [messages[messages.length - 1],{role: 'user', content: input}],
      })

      const assistantMessageId = (Date.now() + 1).toString()
      
      for await (const delta of result.textStream) {
        assistantMessage += delta
        setMessages(prev => {
          const existing = prev.find(m => m.id === assistantMessageId)
          if (existing) {
            return prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: assistantMessage }
                : m
            )
          } else {
            return [...prev, {
              id: assistantMessageId,
              role: 'assistant',
              content: assistantMessage
            }]
          }
        })
      }
    } catch (error) {
      console.error('Error generating response:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, there was an error generating the response. Please try again.'
      }])
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#1A1A1A] text-white">
      
    <SidebarProvider>
    <AppSidebar />
    <main className="flex-1 flex flex-col h-full">
      <div className="px-4 py-2">
        <SidebarTrigger/>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full absolute inset-0">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3 mb-6">
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600">DS</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col flex-1">
                  <div className="text-sm whitespace-pre-wrap text-neutral-200">
                    {message.content.split('\n').map((line, index) => (
                      <p key={index} className="mb-2">
                        {line.startsWith('```') ? (
                          <pre className="bg-neutral-800 p-2 rounded my-2 overflow-x-auto">
                            <code>{line.replace(/```\w*\n?/, '').replace(/```$/, '')}</code>
                          </pre>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3 mb-6">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600">DS</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm text-neutral-300">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-neutral-800 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-3 flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800">
                  <BrainCircuitIcon className="h-4 w-4" />
                  <span className="sr-only">DeepThink</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800">
                  <SearchIcon className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-3 px-1 text-[10px] bg-blue-600 hover:bg-blue-600">NEW</Badge>
                  <span className="sr-only">Search</span>
                </Button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message DeepSeek"
                className="w-full bg-neutral-800/50 text-white placeholder:text-neutral-400 rounded-xl pl-24 pr-20 py-3 min-h-[50px] max-h-[200px] resize-none focus:outline-none focus:ring-1 focus:ring-neutral-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                disabled={isGenerating}
                rows={1}
              />
              <div className="absolute right-3 flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800">
                  <PaperclipIcon className="h-4 w-4" />
                  <span className="sr-only">Attach file</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800" disabled={isGenerating || !input.trim()}>
                  <ArrowUpIcon className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </form>
          <p className="text-xs text-center text-neutral-500 mt-2">
            AI-generated, for reference only
          </p>
        </div>
      </div>
    </main>
    </SidebarProvider>
  </div>
  )
}

