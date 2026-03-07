import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Save, Trash2, Calendar as CalendarIcon, Clock, MapPin, AlignLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Calendar = () => {
    const { token, user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewType, setViewType] = useState('dayGridMonth');
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end: '',
        description: '',
        allDay: false
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/calendar/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setEvents(data.events || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (selectInfo) => {
        setSelectedEvent(null);
        setFormData({
            title: '',
            start: selectInfo.startStr.includes('T') ? selectInfo.startStr.slice(0, 16) : selectInfo.startStr,
            end: selectInfo.endStr.includes('T') ? selectInfo.endStr.slice(0, 16) : selectInfo.endStr,
            description: '',
            allDay: selectInfo.allDay
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            start: event.startStr.includes('T') ? event.startStr.slice(0, 16) : event.startStr,
            end: event.endStr ? (event.endStr.includes('T') ? event.endStr.slice(0, 16) : event.endStr) : event.startStr,
            description: event.extendedProps.description || '',
            allDay: event.allDay
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = selectedEvent && !selectedEvent.id.startsWith('task_') ? 'PUT' : 'POST';
        const url = selectedEvent && !selectedEvent.id.startsWith('task_')
            ? `${API_BASE_URL}/calendar/events/${selectedEvent.id}` 
            : `${API_BASE_URL}/calendar/events`;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchEvents();
            }
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        if (!window.confirm('Delete this event?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/calendar/events/${selectedEvent.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchEvents();
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const upcomingEvents = [...events]
        .filter(e => new Date(e.start) >= new Date())
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 5);

    return (
        <div className="h-screen bg-black text-white overflow-hidden flex flex-col">
            <Header />
            
            <main className="flex-1 pt-20 pb-4 px-4 lg:px-8 flex flex-col gap-4 overflow-hidden">
                {/* Compact Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                            <CalendarIcon size={24} className="text-indigo-400" />
                            Schedule
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setSelectedEvent(null);
                                setFormData({
                                    title: '',
                                    start: new Date().toISOString().slice(0, 16),
                                    end: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
                                    description: '',
                                    allDay: false
                                });
                                setIsModalOpen(true);
                            }}
                            className="group relative flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus size={18} />
                            <span>New Event</span>
                            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                    {/* Left Sidebar - Upcoming */}
                    <div className="hidden xl:flex flex-col w-72 shrink-0 gap-4">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md overflow-y-auto custom-scrollbar">
                            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={14} />
                                Upcoming
                            </h3>
                            <div className="space-y-4">
                                {upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={event.id} 
                                        className="group p-3 bg-white/5 border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer"
                                        onClick={() => handleEventClick({ event: { ...event, extendedProps: { description: event.description } } })}
                                    >
                                        <div className="text-xs text-slate-400 mb-1 flex justify-between">
                                            <span>{new Date(event.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            <span>{event.allDay ? 'All Day' : new Date(event.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                                            {event.title}
                                        </h4>
                                        {event.source === 'google' && (
                                            <div className="mt-2 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className="text-[10px] text-slate-500 uppercase">Google Cal</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )) : (
                                    <div className="text-center py-8 text-slate-500 italic text-sm">
                                        No upcoming events
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats/Info */}
                        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <CalendarIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-300 font-medium uppercase tracking-tight">Today</p>
                                    <p className="text-sm font-bold">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Container */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden flex flex-col">
                        <div className="flex-1 min-h-0">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                }}
                                editable={true}
                                selectable={true}
                                selectMirror={true}
                                dayMaxEvents={3}
                                events={events}
                                select={handleDateSelect}
                                eventClick={handleEventClick}
                                height="100%"
                                themeSystem="standard"
                                nowIndicator={true}
                                handleWindowResize={true}
                                windowResizeDelay={100}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-10 bg-slate-900/90 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {selectedEvent ? 'Event Details' : 'Create Event'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Title</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            placeholder="What's happening?"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Start</label>
                                        <input
                                            type={formData.allDay ? "date" : "datetime-local"}
                                            name="start"
                                            value={formData.start}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">End</label>
                                        <input
                                            type={formData.allDay ? "date" : "datetime-local"}
                                            name="end"
                                            value={formData.end}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="allDay"
                                            name="allDay"
                                            checked={formData.allDay}
                                            onChange={handleInputChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        <label htmlFor="allDay" className="ml-3 text-sm font-medium text-slate-300">All Day Event</label>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Notes</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                        placeholder="Add more details..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    {selectedEvent && !selectedEvent.id.startsWith('task_') && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="flex items-center justify-center p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-colors border border-red-500/20"
                                            title="Delete Event"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                                    >
                                        <Save size={18} />
                                        <span>{selectedEvent ? 'Update' : 'Save'} Event</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

                .fc {
                    --fc-border-color: rgba(255, 255, 255, 0.08);
                    --fc-daygrid-event-dot-width: 6px;
                    --fc-event-bg-color: #4f46e5;
                    --fc-event-border-color: #4f46e5;
                    --fc-today-bg-color: rgba(79, 70, 229, 0.1);
                    --fc-neutral-bg-color: transparent;
                    --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.05);
                    font-family: inherit;
                    color: #cbd5e1;
                }
                .fc .fc-toolbar-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                }
                .fc .fc-button-primary {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .fc .fc-button-primary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active {
                    background: #4f46e5 !important;
                    border-color: #4f46e5 !important;
                    color: white;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }
                .fc .fc-col-header-cell {
                    padding: 12px 0;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                }
                .fc-daygrid-day-number {
                    padding: 8px !important;
                    font-size: 0.85rem;
                    font-weight: 500;
                    opacity: 0.7;
                }
                .fc-day-today .fc-daygrid-day-number {
                    color: #818cf8;
                    font-weight: 700;
                    opacity: 1;
                }
                .fc-event {
                    border-radius: 6px;
                    padding: 2px 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    cursor: pointer;
                    margin: 1px 2px;
                }
                .fc-daygrid-event:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }
                .fc-theme-standard td, .fc-theme-standard th {
                    border-color: rgba(255, 255, 255, 0.05);
                }
                .fc-scrollgrid {
                    border-radius: 16px;
                    border: none !important;
                }
                .fc-daygrid-more-link {
                    font-size: 0.7rem;
                    color: #818cf8;
                    font-weight: 700;
                    padding-left: 4px;
                }
            `}</style>
        </div>
    );
};

export default Calendar;
