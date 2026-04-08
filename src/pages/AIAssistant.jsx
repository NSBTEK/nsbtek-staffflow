import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Plus, User as UserIcon, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from "../lib/base44Stub";

const SYSTEM_PROMPT = `You are StaffFlow AI, an intelligent assistant for the NSBTEK StaffFlow ATS/CRM platform. 
You help recruiters and HR professionals with:
- Finding and matching candidates to job openings
- Drafting outreach emails and job descriptions
- Analyzing recruitment metrics and pipelines
- Providing HR best practices and compliance guidance
- Answering questions about workforce management

Be concise, professional, and practical. Format responses with markdown when helpful.`;

export default function AIAssistant() {
  const [conversations, setConversations] = useState([{ id: 1, title: 'New Conversation', messages: [] }]);
  const [activeId, setActiveId] = useState(1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const active = conversations.find(c => c.id === activeId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setInput('');
    setLoading(true);

    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? userMsg.content.slice(0, 40) : c.title } : c
    ));

    try {
      const history = [...(active?.messages || []), userMsg];
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const assistantMsg = { role: 'assistant', content: data.content?.[0]?.text || 'Sorry, I could not generate a response.' };
      setConversations(prev => prev.map(c =>
        c.id === activeId ? { ...c, messages: [...c.messages, userMsg, assistantMsg] } : c
      ));
    } catch (e) {
      const errMsg = { role: 'assistant', content: '⚠️ Unable to connect to AI service. Please check your network connection.' };
      setConversations(prev => prev.map(c =>
        c.id === activeId ? { ...c, messages: [...c.messages, userMsg, errMsg] } : c
      ));
    } finally {
      setLoading(false);
    }
  };

  const newConversation = () => {
    const id = Date.now();
    setConversations(prev => [...prev, { id, title: 'New Conversation', messages: [] }]);
    setActiveId(id);
  };

  return (
    <div className="flex h-[calc(100vh-44px)]">
      {/* Sidebar */}
      <div className="w-56 border-r border-border bg-card/30 flex flex-col">
        <div className="p-3 border-b border-border">
          <Button onClick={newConversation} variant="outline" size="sm" className="w-full gap-2">
            <Plus className="w-3 h-3" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${activeId === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}>
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {active?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">StaffFlow AI Assistant</h2>
                <p className="text-sm text-muted-foreground max-w-sm">Ask me anything about recruiting, HR, candidates, jobs, or your workforce data.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  'Draft a job description for a React developer',
                  'What are best practices for candidate screening?',
                  'Help me write a candidate outreach email',
                  'How do I improve my offer acceptance rate?',
                ].map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {active?.messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.role === 'assistant' ? <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{msg.content}</ReactMarkdown> : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder="Ask anything about recruiting, HR, candidates..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon" className="rounded-xl w-10 h-10 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
