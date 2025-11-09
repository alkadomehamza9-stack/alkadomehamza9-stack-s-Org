import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from './Icons';
import { supabaseAPI } from '../services/supabase';
import { Student, Absence } from '../types';

declare const XLSX: any;

interface SchoolAbsenceProps {
  onBack: () => void;
}

const SchoolAbsence: React.FC<SchoolAbsenceProps> = ({ onBack }) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const { grades, classesByGrade } = useMemo(() => {
    const grades = [...new Set(allStudents.map(s => s.grade))].sort();
    const classesByGrade: Record<string, string[]> = {};
    allStudents.forEach(student => {
      if (!classesByGrade[student.grade]) {
        classesByGrade[student.grade] = [];
      }
      if (!classesByGrade[student.grade].includes(student.class)) {
        classesByGrade[student.grade].push(student.class);
      }
    });
    for (const grade in classesByGrade) {
        classesByGrade[grade].sort();
    }
    return { grades, classesByGrade };
  }, [allStudents]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const data = await supabaseAPI.getAllStudents();
    setAllStudents(data || []);
    if (data && data.length > 0) {
      const initialGrade = [...new Set(data.map(s => s.grade))].sort()[0];
      setSelectedGrade(initialGrade);
      const initialClasses = [...new Set(data.filter(s=>s.grade === initialGrade).map(s => s.class))].sort();
      if(initialClasses.length > 0) {
        setSelectedClass(initialClasses[0]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  const fetchAbsences = useCallback(async () => {
    if (!selectedDate) return;
    const data = await supabaseAPI.getAbsencesByDate(selectedDate);
    setAbsences(data || []);
  }, [selectedDate]);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  const filteredStudents = useMemo(() => {
    if (!selectedGrade || !selectedClass) return [];
    return allStudents.filter(s => s.grade === selectedGrade && s.class === selectedClass);
  }, [allStudents, selectedGrade, selectedClass]);
  
  const absentStudentIds = useMemo(() => new Set(absences.map(a => a.student_id)), [absences]);
  
  const handleToggleAbsence = async (student: Student) => {
    setUpdatingStudentId(student.id);
    const isAbsent = absentStudentIds.has(student.id);
    
    if (isAbsent) {
      const absenceRecord = absences.find(a => a.student_id === student.id);
      if (absenceRecord) {
        await supabaseAPI.deleteAbsence(absenceRecord.id);
      }
    } else {
      await supabaseAPI.addAbsence({ student_id: student.id, absence_date: selectedDate });
    }
    
    await fetchAbsences();
    setUpdatingStudentId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (filteredStudents.length === 0) {
        alert('لا يوجد طلاب لتصديرهم في هذه الشعبة.');
        return;
    }
    const dataToExport = filteredStudents.map(student => ({
      'اسم الطالب': student.name,
      'الحالة': absentStudentIds.has(student.id) ? 'غائب' : 'حاضر',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'غياب الشعبة');

    XLSX.writeFile(workbook, `غياب-${selectedGrade}-${selectedClass}-بتاريخ-${selectedDate}.xlsx`);
  };
  
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center"><Icon name="calendar" className="w-8 h-8 mr-3 text-red-500" /> غياب المدرسة</h1>
        <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-header bg-blue-500"><Icon name="printer" className="w-4 h-4 mr-2"/> طباعة</button>
            <button onClick={handleExportToExcel} className="btn-header bg-green-500"><Icon name="download" className="w-4 h-4 mr-2"/> تصدير Excel</button>
            <button onClick={onBack} className="flex items-center text-purple-600 hover:text-purple-800 font-semibold transition-colors px-4 py-2">
                <Icon name="arrow-right" className="w-5 h-5 ml-2 transform -scale-x-100" />
                العودة
            </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div>
            <label className="text-sm font-medium text-gray-700">الصف</label>
            <select value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setSelectedClass(classesByGrade[e.target.value]?.[0] || ''); }} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
        </div>
        <div>
            <label className="text-sm font-medium text-gray-700">الشعبة</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                {(classesByGrade[selectedGrade] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
        <div>
            <label className="text-sm font-medium text-gray-700">التاريخ</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" />
        </div>
      </div>

       <div className="printable-area">
          <div className="hidden print:block text-center mb-4">
            <h2 className="text-xl font-bold">تقرير غياب المدرسة</h2>
            <p>الصف: {selectedGrade} - الشعبة: {selectedClass}</p>
            <p>التاريخ: {new Date(selectedDate).toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan={2} className="text-center p-5">جاري تحميل الطلاب...</td></tr>
                ) : filteredStudents.length === 0 ? (
                    <tr><td colSpan={2} className="text-center p-5">لا يوجد طلاب في هذه الشعبة.</td></tr>
                ) : (
                    filteredStudents.map(student => {
                      const isAbsent = absentStudentIds.has(student.id);
                      return (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{student.name}</td>
                            <td className="p-3">
                                <button
                                  onClick={() => handleToggleAbsence(student)}
                                  disabled={updatingStudentId === student.id}
                                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors w-24 text-center no-print ${
                                    isAbsent ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  } disabled:opacity-50 disabled:cursor-wait`}
                                >
                                  {updatingStudentId === student.id ? '...' : (isAbsent ? 'غائب' : 'حاضر')}
                                </button>
                                <span className="hidden print:inline">{isAbsent ? 'غائب' : 'حاضر'}</span>
                            </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
       </div>

    </div>
  );
};

export default SchoolAbsence;