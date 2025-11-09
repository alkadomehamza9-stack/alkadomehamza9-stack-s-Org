
export interface Student {
  id: number;
  name: string;
  class: string;
  grade: string;
  national_id?: string;
  birth_date?: string;
  address?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  parent_name?: string;
  created_at: string;
}

export interface Absence {
  id: number;
  student_id: number;
  absence_date: string;
  reason?: string;
  created_at: string;
}

export interface Action {
  id: number;
  student_id: number;
  type: ActionType;
  note?: string;
  created_at: string;
}

export type ActionType = 'مغادرة' | 'تنبيه' | 'إنذار' | 'استدعاء ولي أمر' | 'مخالفة' | 'تأخير' | 'تبليغ غياب';

export type UserType = 'limited' | 'full' | null;

export type View = 'dashboard' | 'studentProfile' | 'schoolAbsence' | 'highAbsence' | 'reports';