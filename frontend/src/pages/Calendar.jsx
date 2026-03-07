import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { motion } from 'motion/react';
import { Plus, Calendar as CalendarIcon, List, Clock, X, Save, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Calendar = () => {
    const { token, user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
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
            } else {
                console.error('Failed to fetch events:', data.error);
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
            start: selectInfo.startStr,
            end: selectInfo.endStr,
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
            start: event.startStr,
            end: event.endStr || event.startStr,
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
        const method = selectedEvent ? 'PUT' : 'POST';
        const url = selectedEvent 
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
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to save event');
            }
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        if (!window.confirm('Are you sure you want to delete this event?')) return;

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
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            
            <main className="pt-24 pb-12 px-6 lg:px-12 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            My Calendar
                        </h1>
                        <p className="text-slate-400 mt-1">Manage your schedule and sync with Google Calendar</p>
                    </div>
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
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={20} />
                        Add Event
                    </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    {loading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <div className="h-10 w-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="calendar-container">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                                }}
                                editable={true}
                                selectable={true}
                                selectMirror={true}
                                dayMaxEvents={true}
                                events={events}
                                select={handleDateSelect}
                                eventClick={handleEventClick}
                                height="700px"
                                themeSystem="standard"
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white">
                                {selectedEvent ? 'Edit Event' : 'New Event'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="e.g. Content Strategy Meeting"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Start</label>
                                    <input
                                        type={formData.allDay ? "date" : "datetime-local"}
                                        name="start"
                                        value={formData.start}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">End</label>
                                    <input
                                        type={formData.allDay ? "date" : "datetime-local"}
                                        name="end"
                                        value={formData.end}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="allDay"
                                    name="allDay"
                                    checked={formData.allDay}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/50"
                                />
                                <label htmlFor="allDay" className="text-sm text-slate-300">All Day Event</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Description / Notes</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Add any notes here..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                {selectedEvent && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-medium transition-colors"
                                    >
                                        <Trash2 size={18} />
                                        Delete
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    <Save size={18} />
                                    {selectedEvent ? 'Update Event' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <style jsx global>{`
                .fc {
                    --fc-border-color: rgba(255, 255, 255, 0.1);
                    --fc-daygrid-event-dot-width: 8px;
                    --fc-event-bg-color: #4f46e5;
                    --fc-event-border-color: #4f46e5;
                    --fc-today-bg-color: rgba(79, 70, 229, 0.05);
                    color: white;
                }
                .fc .fc-toolbar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                .fc .fc-button-primary {
                    background-color: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    text-transform: capitalize;
                }
                .fc .fc-button-primary:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active, 
                .fc .fc-button-primary:not(:disabled):active {
                    background-color: #4f46e5;
                    border-color: #4f46e5;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                    border-color: rgba(255, 255, 255, 0.05);
                }
                .fc .fc-list-event:hover td {
                    background-color: rgba(255, 255, 255, 0.05);
                }
                .fc-list-day-cushion {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                .fc-list-event-title a {
                    color: white !important;
                }
            `}</style>
        </div>
    );
};

export default Calendar;
