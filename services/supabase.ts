
import { createClient } from '@supabase/supabase-js';
import { Student, Absence, Action } from '../types';

const SUPABASE_URL = 'https://vpirofwthtbvxfcqmjps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXJvZnd0aHRidnhmY3FtanBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjUzOTIsImV4cCI6MjA3ODIwMTM5Mn0.V-X9EMwxeoWysj3EB_OfP2unNoah874rhxFOEvoN3Sw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseAPI = {
  async getAllStudents(): Promise<Student[] | null> {
    const { data, error } = await supabase.from('students').select('*').order('name');
    if (error) {
      console.error('Error fetching students:', error);
      return null;
    }
    return data;
  },

  async getStudentById(id: number): Promise<Student | null> {
    const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
    if (error) {
      console.error('Error fetching student by ID:', error);
      return null;
    }
    return data;
  },
  
  async addStudent(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student | null> {
    const { data, error } = await supabase.from('students').insert([studentData]).select();
    if (error) {
      console.error('Error adding student:', error);
      return null;
    }
    return data ? data[0] : null;
  },

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | null> {
    const { data, error } = await supabase.from('students').update(studentData).eq('id', id).select();
    if (error) {
      console.error('Error updating student:', error);
      return null;
    }
    return data ? data[0] : null;
  },

  async getStudentAbsences(studentId: number): Promise<Absence[] | null> {
    const { data, error } = await supabase.from('absences').select('*').eq('student_id', studentId).order('absence_date', { ascending: false });
    if (error) {
      console.error('Error fetching absences:', error);
      return null;
    }
    return data;
  },
  
  async addAbsence(absenceData: Omit<Absence, 'id' | 'created_at'>): Promise<{ data: Absence | null; error: any | null }> {
    const { data, error } = await supabase.from('absences').insert([absenceData]).select().single();
    if (error) {
      console.error('Error adding absence:', error);
    }
    return { data, error };
  },

  async addBulkAbsences(absencesData: Omit<Absence, 'id' | 'created_at'>[]): Promise<Absence[] | null> {
    if (absencesData.length === 0) return [];
    const { data, error } = await supabase.from('absences').insert(absencesData).select();
    if (error) {
      console.error('Error adding bulk absences:', error);
      return null;
    }
    return data;
  },

  async deleteAbsence(absenceId: number): Promise<boolean> {
    const { error } = await supabase.from('absences').delete().eq('id', absenceId);
    if (error) {
      console.error('Error deleting absence:', error);
      return false;
    }
    return true;
  },

  async getStudentActions(studentId: number): Promise<Action[] | null> {
    const { data, error } = await supabase.from('actions').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching actions:', error);
      return null;
    }
    return data;
  },

  async addAction(actionData: Omit<Action, 'id' | 'created_at'>): Promise<Action | null> {
    const { data, error } = await supabase.from('actions').insert([actionData]).select();
    if (error) {
      console.error('Error adding action:', error);
      return null;
    }
    return data ? data[0] : null;
  },

  async deleteAction(actionId: number): Promise<boolean> {
    const { error } = await supabase.from('actions').delete().eq('id', actionId);
    if (error) {
      console.error('Error deleting action:', error);
      return false;
    }
    return true;
  },

  // New functions for reports and school absence pages
  async getAllAbsences(): Promise<Absence[] | null> {
    const { data, error } = await supabase.from('absences').select('*');
    if (error) {
      console.error('Error fetching all absences:', error);
      return null;
    }
    return data;
  },

  async getAllActions(): Promise<Action[] | null> {
    const { data, error } = await supabase.from('actions').select('*');
    if (error) {
      console.error('Error fetching all actions:', error);
      return null;
    }
    return data;
  },

  async getAbsencesByDate(date: string): Promise<Absence[] | null> {
    const { data, error } = await supabase.from('absences').select('*').eq('absence_date', date);
    if (error) {
      console.error('Error fetching absences by date:', error);
      return null;
    }
    return data;
  },
};
