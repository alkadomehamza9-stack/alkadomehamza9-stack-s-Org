import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icons';
import { supabaseAPI } from '../services/supabase';
import { Student, Absence } from '../types';

declare const XLSX: any;

interface HighAbsenceProps {
  onBack: () => void;
  viewStudent: (studentId: number) => void;
}

const FILTERS = [5, 10, 15, 23];

const HighAbsence: React.FC<HighAbsenceProps> = ({ onBack, viewStudent }) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<number>(FILTERS[0]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [studentsData, absencesData] = await Promise.all([
        supabaseAPI.getAllStudents(),
        supabaseAPI.getAllAbsences(),
      ]);
      setAllStudents(studentsData || []);
      setAllAbsences(absencesData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const absenceCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const absence of allAbsences) {
      counts.set(absence.student_id, (counts.get(absence.student_id) || 0) + 1);
    }
    return counts;
  }, [allAbsences]);

  const filteredStudents = useMemo(() => {
    return allStudents
      .map(student => ({
        ...student,
        absenceCount: absenceCounts.get(student.id) || 0,
      }))
      .filter(student => student.absenceCount >= activeFilter)
      .sort((a, b) => b.absenceCount - a.absenceCount);
  }, [allStudents, absenceCounts, activeFilter]);

  const handleExportToExcel = () => {
    if (filteredStudents.length === 0) return;

    const dataToExport = filteredStudents.map(student => ({
      'اسم الطالب': student.name,
      'الصف': student.grade,
      'الشعبة': student.class,
      'عدد أيام الغياب': student.absenceCount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الغياب المرتفع');

    XLSX.writeFile(workbook, `تقرير الغياب المرتفع - ${activeFilter} يوم فأكثر.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Icon name="warning" className="w-8 h-8 mr-3 text-yellow-500" /> الغياب المرتفع
        </h1>
        <button onClick={onBack} className="flex items-center text-purple-600 hover:text-purple-800 font-semibold transition-colors">
          <Icon name="arrow-right" className="w-5 h-5 ml-2 transform -scale-x-100" />
          العودة
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex flex-wrap justify-center gap-2">
          {FILTERS.map(days => (
            <button
              key={days}
              onClick={() => setActiveFilter(days)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeFilter === days
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {days} أيام فأكثر
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="btn-header bg-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              <Icon name="printer" className="w-4 h-4 mr-2" />
              طباعة
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={filteredStudents.length === 0}
              className="btn-header bg-green-500 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              <Icon name="download" className="w-4 h-4 mr-2" />
              تصدير إلى Excel
            </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 p-10">جاري تحميل البيانات...</p>
      ) : (
        <div className="printable-area">
          <div className="hidden print:block text-center mb-4">
            <h2 className="text-xl font-bold">تقرير الغياب المرتفع</h2>
            <p>الطلاب الذين لديهم غياب {activeFilter} أيام أو أكثر</p>
          </div>
          <p className="mb-4 text-gray-600 no-print">
            يتم عرض الطلاب الذين لديهم غياب <strong>{activeFilter} أيام أو أكثر</strong> (إجمالي: {filteredStudents.length} طالب).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف - الشعبة</th>
                  <th className="p-3 text-center">أيام الغياب</th>
                  <th className="p-3 text-center no-print">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-10 text-gray-500">
                      لا يوجد طلاب يطابقون هذا الفلتر.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{student.name}</td>
                      <td className="p-3 text-gray-600">{student.grade} - {student.class}</td>
                      <td className="p-3 text-center font-bold text-red-600">{student.absenceCount}</td>
                      <td className="p-3 text-center no-print">
                        <button
                          onClick={() => viewStudent(student.id)}
                          className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600 transition-colors"
                        >
                          عرض الملف
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighAbsence;