"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Bot, User, Sparkles, Code, FileText, Lightbulb, Zap, Settings } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface Model {
  name: string
  size: number
  modified_at: string
}

const SUGGESTED_PROMPTS = [
  {
    icon: Code,
    title: "Code Review",
    prompt: "Review this code and suggest improvements for better performance and readability",
  },
  {
    icon: FileText,
    title: "Documentation",
    prompt: "Help me write comprehensive documentation for this project",
  },
  {
    icon: Lightbulb,
    title: "Problem Solving",
    prompt: "I need help solving a complex technical problem. Can you guide me through it?",
  },
  {
    icon: Zap,
    title: "Optimization",
    prompt: "How can I optimize this system for better performance and scalability?",
  },
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState("llama3:latest")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkOllamaConnection()
    loadModels()
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const checkOllamaConnection = async () => {
    try {
      const response = await fetch("/api/health")
      setIsConnected(response.ok)
    } catch (error) {
      setIsConnected(false)
    }
  }

  const loadModels = async () => {
    try {
      const response = await fetch("/api/models")
      if (response.ok) {
        const data = await response.json()
        setModels(data.models)
      }
    } catch (error) {
      console.error("Failed to load models:", error)
    }
  }

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim()
    if (!content || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please make sure Ollama is running locally.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const clearChat = () => {
    setMessages([])
  }

  const formatModelSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/90 backdrop-blur-md shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Ollama AI Assistant</h1>
                <p className="text-sm text-slate-400">Professional AI Chat Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Model Selector */}
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-slate-400" />
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {models.map((model) => (
                      <SelectItem key={model.name} value={model.name} className="text-white hover:bg-slate-700">
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-slate-400">{formatModelSize(model.size)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={
                  isConnected
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                    : "bg-red-600 text-white shadow-md"
                }
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent transition-all duration-200"
                >
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome Section */}
        {messages.length === 0 && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 shadow-2xl">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">Welcome to Ollama AI</h2>
            <p className="text-slate-400 text-lg mb-4 max-w-2xl mx-auto">
              Your professional AI assistant powered by local Ollama models.
            </p>
            <p className="text-blue-400 text-sm mb-10">
              Currently using: <span className="font-semibold">{selectedModel}</span>
            </p>

            {/* Suggested Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {SUGGESTED_PROMPTS.map((prompt, index) => {
                const IconComponent = prompt.icon
                return (
                  <Card
                    key={index}
                    className="p-6 bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-blue-600/50 transition-all duration-300 cursor-pointer group shadow-xl backdrop-blur-sm"
                    onClick={() => sendMessage(prompt.prompt)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 group-hover:from-blue-600/30 group-hover:to-indigo-600/30 transition-all duration-300 border border-blue-600/20">
                        <IconComponent className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-white mb-2 text-lg">{prompt.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{prompt.prompt}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <Card className="mb-6 bg-slate-800/30 border-slate-700/50 shadow-2xl backdrop-blur-sm">
            <ScrollArea className="h-[500px] p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-4 ${
                      message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full shadow-lg ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                          : "bg-gradient-to-r from-slate-700 to-slate-600"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Bot className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block p-4 rounded-2xl max-w-[85%] shadow-lg ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            : "bg-slate-800/60 text-slate-100 border border-slate-700/50 backdrop-blur-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 px-1">{message.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Input Form */}
        <Card className="bg-slate-800/40 border-slate-700/50 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex space-x-4">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading || !isConnected}
                className="flex-1 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-12 px-4 rounded-xl backdrop-blur-sm"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || !isConnected}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg h-12 px-6 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {!isConnected && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                <p className="text-sm text-red-400">⚠️ Please ensure Ollama is running locally on port 11434</p>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  )
}
