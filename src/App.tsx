/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Bell, 
  Settings, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  User,
  Mail,
  MessageSquare,
  FileText,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, isTomorrow, addDays, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ItemType = 'assignment' | 'test' | 'event' | 'message' | 'prep';
type Priority = 'low' | 'medium' | 'high';
type Status = 'pending' | 'completed' | 'dismissed';

interface Child {
  id: number;
  name: string;
  grade: string;
}

interface SchoolItem {
  id: number;
  child_id: number;
  child_name: string;
  type: ItemType;
  title: string;
  description: string;
  due_date: string;
  priority: Priority;
  status: Status;
  source_type: string;
}

interface Briefing {
  id: number;
  date: string;
  content: string;
}

export default function App() {
  const [children, setChildren] = useState<Child[]>([]);
  const [items, setItems] = useState<SchoolItem[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | 'all'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'briefing' | 'settings'>('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [childrenRes, itemsRes, briefingsRes] = await Promise.all([
        fetch('/api/children'),
        fetch('/api/items'),
        fetch('/api/briefings')
      ]);
      
      setChildren(await childrenRes.json());
      setItems(await itemsRes.json());
      setBriefings(await briefingsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateItemStatus = async (id: number, status: Status) => {
    try {
      await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const filteredItems = items.filter(item => 
    (selectedChildId === 'all' || item.child_id === selectedChildId) &&
    item.status === 'pending'
  );

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'assignment': return <BookOpen className="w-4 h-4" />;
      case 'test': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'message': return <Mail className="w-4 h-4 text-amber-500" />;
      case 'prep': return <RefreshCw className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        fetchData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-[#141414]/10 bg-[#E4E3E0] z-50">
        <div className="p-6 border-bottom border-[#141414]/10">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            SCHOOLCOMMAND
          </h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Family Intelligence Agent</p>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeTab === 'dashboard' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeTab === 'calendar' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
            )}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button 
            onClick={() => setActiveTab('briefing')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeTab === 'briefing' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
            )}
          >
            <FileText className="w-4 h-4" />
            Daily Briefing
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeTab === 'settings' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
            )}
          >
            <Settings className="w-4 h-4" />
            Integrations
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#141414]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center text-[#E4E3E0]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Parent Account</p>
              <p className="text-[10px] opacity-50">3 Children Connected</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 min-h-screen">
        {/* Header */}
        <header className="h-20 border-b border-[#141414]/10 flex items-center justify-between px-8 bg-[#E4E3E0]/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="flex bg-[#141414]/5 p-1 rounded-lg">
              <button 
                onClick={() => setSelectedChildId('all')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                  selectedChildId === 'all' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/10"
                )}
              >
                MASTER
              </button>
              {children.map(child => (
                <button 
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    selectedChildId === child.id ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/10"
                  )}
                >
                  {child.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-[#E4E3E0] rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? 'SYNCING...' : 'SYNC AGENT'}
            </button>
            <button className="p-2 rounded-lg hover:bg-[#141414]/5 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#E4E3E0]"></span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Active Tasks</p>
                  <p className="text-3xl font-bold">{filteredItems.filter(i => i.type === 'assignment' || i.type === 'prep').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Upcoming Tests</p>
                  <p className="text-3xl font-bold text-red-600">{filteredItems.filter(i => i.type === 'test').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Events Today</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {filteredItems.filter(i => i.type === 'event' && i.due_date && isToday(parseISO(i.due_date))).length}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">New Messages</p>
                  <p className="text-3xl font-bold text-amber-600">{filteredItems.filter(i => i.type === 'message').length}</p>
                </div>
              </div>

              {/* Action Feed */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 italic font-serif">
                    Priority Action Items
                    <span className="text-xs font-sans not-italic font-normal opacity-50 bg-[#141414]/5 px-2 py-0.5 rounded-full">
                      {filteredItems.length} items
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md hover:bg-[#141414]/5 text-xs font-bold flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_100px] px-6 py-3 border-b border-[#141414]/5 bg-slate-50/50">
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Type</div>
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Description</div>
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Child</div>
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Due Date</div>
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-right">Action</div>
                  </div>

                  <div className="divide-y divide-[#141414]/5">
                    <AnimatePresence mode="popLayout">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={item.id}
                            className="grid grid-cols-[40px_1.5fr_1fr_1fr_100px] px-6 py-4 items-center hover:bg-slate-50 transition-colors group"
                          >
                            <div className="flex justify-center">{getTypeIcon(item.type)}</div>
                            <div>
                              <p className="text-sm font-bold group-hover:underline cursor-pointer">{item.title}</p>
                              <p className="text-xs opacity-50 line-clamp-1">{item.description}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 uppercase tracking-tight">
                                {item.child_name}
                              </span>
                            </div>
                            <div className="text-xs font-mono">
                              {item.due_date ? format(parseISO(item.due_date), 'MMM d, h:mm a') : 'No Date'}
                            </div>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => updateItemStatus(item.id, 'completed')}
                                className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateItemStatus(item.id, 'dismissed')}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="py-20 text-center">
                          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-20 mb-4" />
                          <p className="text-sm font-medium opacity-50">All caught up! No pending actions.</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Daily Briefing Preview */}
              <section className="grid grid-cols-2 gap-8">
                <div className="bg-[#141414] text-[#E4E3E0] p-8 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FileText className="w-32 h-32" />
                  </div>
                  <h3 className="text-2xl font-serif italic mb-4">Daily Briefing</h3>
                  <p className="text-sm opacity-70 mb-6 leading-relaxed">
                    Good morning! Today is a heavy day for <span className="text-white font-bold">Child 1</span> with a math test. 
                    <span className="text-white font-bold">Child 3</span> needs to bring library books. 
                    The weather is rainy, so pack umbrellas.
                  </p>
                  <button 
                    onClick={() => setActiveTab('briefing')}
                    className="px-6 py-2 bg-[#E4E3E0] text-[#141414] rounded-full text-xs font-bold hover:scale-105 transition-transform"
                  >
                    READ FULL BRIEFING
                  </button>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-[#141414]/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Agent Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 opacity-50" />
                        <span className="text-sm">Gmail (School Newsletters)</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">CONNECTED</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 opacity-50" />
                        <span className="text-sm">Google Calendar</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">CONNECTED</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 opacity-50" />
                        <span className="text-sm">Microsoft Teams</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">PENDING</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold font-serif italic">Integrations & Setup</h2>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold">Google Workspace</p>
                      <p className="text-xs opacity-50">Gmail & Google Calendar</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleConnectGoogle}
                    className="px-4 py-2 bg-[#141414] text-[#E4E3E0] rounded-lg text-xs font-bold"
                  >
                    CONNECT
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold">Microsoft Teams</p>
                      <p className="text-xs opacity-50">Assignments & Class Posts</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-[#141414] text-[#E4E3E0] rounded-lg text-xs font-bold">CONNECT</button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold">Newsletter PDF Parsing</p>
                      <p className="text-xs opacity-50">Upload or forward school PDFs</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-[#141414] text-[#E4E3E0] rounded-lg text-xs font-bold">CONFIGURE</button>
                </div>
              </div>

              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Configuration Required
                </h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  To enable automated background syncing, you must provide your Google and Microsoft API credentials in the environment settings.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'briefing' && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold font-serif italic">Daily Briefing</h2>
                <p className="text-sm font-mono opacity-50">
                  {briefings[0] ? format(parseISO(briefings[0].date), 'EEEE, MMMM do') : format(new Date(), 'EEEE, MMMM do')}
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-[#141414]/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 pb-2 border-b border-[#141414]/5">Today's Overview</h3>
                  <div className="prose prose-sm max-w-none text-[#141414]/80 markdown-body">
                    {briefings[0] ? (
                      <ReactMarkdown>{briefings[0].content}</ReactMarkdown>
                    ) : (
                      <p>No briefing generated yet. Click 'Sync Agent' to generate one.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
