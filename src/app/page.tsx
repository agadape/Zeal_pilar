'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/DashboardView';
import PeopleView from '@/components/PeopleView';
import GroupsView from '@/components/GroupsView';
import StatistikaView from '@/components/StatistikaView';
import AnnouncementsView from '@/components/AnnouncementsView';
import AdminAccountsView from '@/components/AdminAccountsView';

import { Person, Group, WeeklyStat, Announcement } from '@/lib/types';
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
  getCurrentUserProfile
  } from '@/lib/supabase';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<Person | null>(null);

  // Core App State
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<WeeklyStat[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Load all initial data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [peopleData, groupsData, statsData, announcementsData, userProfile] = await Promise.all([
        fetchPeople(),
        fetchGroups(),
        fetchWeeklyStats(),
        fetchAnnouncements(),
        getCurrentUserProfile()
      ]);

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !userProfile) {
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
      setCurrentUser(userProfile);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleSavePerson = async (person: Omit<Person, 'id'> & { id?: string }) => {
    await savePerson(person);
    await loadAllData();
  };

  const handleDeletePerson = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data orang ini?')) {
      await deletePerson(id);
      await loadAllData();
    }
  };

  const handleSaveBALog = async (log: { person_id: string; mentor_id?: string; week_number: number; study_date: string; lesson_topic: string; notes?: string }) => {
    await saveBibleStudyLog(log);
    await loadAllData();
  };

  const handleSaveGroup = async (group: Omit<Group, 'id'> & { id?: string }) => {
    await saveGroup(group);
    await loadAllData();
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus Small Group ini?')) {
      await deleteGroup(id);
      await loadAllData();
    }
  };

  const handleHandoverLeadership = async (params: { group_id: string; new_leader_id: string; reason: string; notes?: string }) => {
    await handoverGroupLeadership(params);
    await loadAllData();
  };

  const handleSaveStat = async (stat: Omit<WeeklyStat, 'id'> & { id?: string }) => {
    await saveWeeklyStat(stat);
    await loadAllData();
  };

  const handleDeleteStat = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus laporan statistik ini?')) {
      await deleteWeeklyStat(id);
      await loadAllData();
    }
  };

  const handleSaveAnnouncement = async (announcement: Omit<Announcement, 'id' | 'author_name'> & { id?: string }) => {
    await saveAnnouncement(announcement);
    await loadAllData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      await deleteAnnouncement(id);
      await loadAllData();
    }
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
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  people={people}
                  groups={groups} 
                  stats={stats} 
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
                  onSaveAnnouncement={handleSaveAnnouncement} 
                  onDeleteAnnouncement={handleDeleteAnnouncement}
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
