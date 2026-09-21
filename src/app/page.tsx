'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/DashboardView';
import PeopleView from '@/components/PeopleView';
import GroupsView from '@/components/GroupsView';
import StatistikaView from '@/components/StatistikaView';
import AnnouncementsView from '@/components/AnnouncementsView';
import AdminAccountsView from '@/components/AdminAccountsView';
import EventsView from '@/components/EventsView';

import { Person, Group, WeeklyStat, Announcement, MinistryEvent } from '@/lib/types';
import { 
  fetchPeople, 
  savePerson, 
  deletePerson,
  saveBibleStudyLog,
  fetchGroups, 
  saveGroup, 
  deleteGroup,
  handoverGroupLeadership,
  fetchWeeklyStats, 
  saveWeeklyStat,
  deleteWeeklyStat,
  fetchAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
  fetchEvents,
  saveEvent,
  deleteEvent,
  isSupabaseConfigured,
  getCurrentUserProfile
  } from '@/lib/supabase';

const LOCAL_ADMIN_PROFILE: Person = {
  id: 'local_admin',
  full_name: 'Local Admin',
  gender: 'BROTHER',
  status: 'LEADER',
  role: 'SUPER_ADMIN',
  is_admin: true
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<Person | null>(null);

  // Core App State
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<WeeklyStat[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<MinistryEvent[]>([]);

  // Load all initial data
  const loadAllData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [peopleData, groupsData, statsData, announcementsData, eventsData, userProfile] = await Promise.all([
        fetchPeople(),
        fetchGroups(),
        fetchWeeklyStats(),
        fetchAnnouncements(),
        fetchEvents(),
        getCurrentUserProfile()
      ]);

      if (isSupabaseConfigured && !userProfile) {
        // Clear session if they are stuck in a state where auth exists but profile is missing
        const { supabase } = await import('@/lib/supabase');
        if (supabase) await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }

      setPeople(peopleData);
      setGroups(groupsData);
      setStats(statsData);
      setAnnouncements(announcementsData);
      setEvents(eventsData);
      setCurrentUser(userProfile || LOCAL_ADMIN_PROFILE);
    } catch (err) {
      console.error('Data loading error:', err);
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat data portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const runMutation = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      await loadAllData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data.';
      alert(message);
      throw error;
    }
  };

  // Handlers
  const handleSavePerson = async (person: Omit<Person, 'id'> & { id?: string }) => {
    await runMutation(() => savePerson(person));
  };

  const handleDeletePerson = async (id: string) => {
    await runMutation(() => deletePerson(id));
  };

  const handleSaveBALog = async (log: { person_id: string; mentor_id?: string; week_number: number; study_date: string; lesson_topic: string; notes?: string }) => {
    await runMutation(() => saveBibleStudyLog(log));
  };

  const handleSaveGroup = async (group: Omit<Group, 'id'> & { id?: string }) => {
    await runMutation(() => saveGroup(group));
  };

  const handleDeleteGroup = async (id: string) => {
    await runMutation(() => deleteGroup(id));
  };

  const handleHandoverLeadership = async (params: { group_id: string; new_leader_id: string; reason: string; notes?: string }) => {
    await runMutation(() => handoverGroupLeadership(params));
  };

  const handleSaveStat = async (stat: Omit<WeeklyStat, 'id'> & { id?: string }) => {
    await runMutation(() => saveWeeklyStat(stat));
  };

  const handleDeleteStat = async (id: string) => {
    await runMutation(() => deleteWeeklyStat(id));
  };

  const handleSaveAnnouncement = async (announcement: Omit<Announcement, 'id' | 'author_name'> & { id?: string }) => {
    await runMutation(() => saveAnnouncement(announcement));
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await runMutation(() => deleteAnnouncement(id));
  };

  const handleSaveEvent = async (event: Omit<MinistryEvent, 'id'> & { id?: string }) => {
    await runMutation(() => saveEvent(event));
  };

  const handleDeleteEvent = async (id: string) => {
    await runMutation(() => deleteEvent(id));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-[#b5852e] selection:text-white">
      
      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#b5852e] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">Memuat portal Tugu Leaders...</p>
            </div>
          ) : loadError ? (
            <div className="py-20 px-6 text-center bg-white border border-rose-100 rounded-[2rem] shadow-xl shadow-rose-100/40 max-w-2xl mx-auto">
              <h1 className="text-xl font-black text-slate-900">Data portal gagal dimuat</h1>
              <p className="text-sm text-rose-600 font-medium mt-2">{loadError}</p>
              <button
                type="button"
                onClick={loadAllData}
                className="mt-6 px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  people={people}
                  groups={groups} 
                  stats={stats} 
                  events={events}
                  currentUser={currentUser}
                  onNavigate={setActiveTab} 
                />
              )}

              {activeTab === 'people' && (
                <PeopleView 
                  people={people} 
                  currentUser={currentUser}
                  onSavePerson={handleSavePerson} 
                  onDeletePerson={handleDeletePerson} 
                  onSaveBALog={handleSaveBALog}
                />
              )}

              {activeTab === 'groups' && (
                <GroupsView 
                  groups={groups} 
                  people={people} 
                  currentUser={currentUser}
                  onSaveGroup={handleSaveGroup} 
                  onDeleteGroup={handleDeleteGroup} 
                  onHandoverLeadership={handleHandoverLeadership}
                  onRefreshData={loadAllData}
                />
              )}

              {activeTab === 'statistika' && (
                <StatistikaView 
                  groups={groups} 
                  people={people} 
                  stats={stats} 
                  currentUser={currentUser}
                  onSaveStat={handleSaveStat} 
                  onDeleteStat={handleDeleteStat}
                />
              )}

              {activeTab === 'announcements' && (
                <AnnouncementsView 
                  announcements={announcements} 
                  currentUser={currentUser}
                  onSaveAnnouncement={handleSaveAnnouncement} 
                  onDeleteAnnouncement={handleDeleteAnnouncement}
                />
              )}

              {activeTab === 'events' && (
                <EventsView
                  events={events}
                  people={people}
                  currentUser={currentUser}
                  onSaveEvent={handleSaveEvent}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}

              {activeTab === 'admin' && (
                <AdminAccountsView 
                  currentUser={currentUser}
                  people={people}
                  onRefreshData={loadAllData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-6 bg-white text-xs text-slate-500 text-center font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 ZEAL Youth & Campus Ministry (GKDI Jogja) • Tugu Leaders Portal</p>
          <div className="flex items-center space-x-4 text-slate-500">
            <span>Vercel Deploy Ready</span>
            <span>•</span>
            <span>Supabase Database Schema</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
