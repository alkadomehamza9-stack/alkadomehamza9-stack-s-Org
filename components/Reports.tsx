import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icons';
import { supabaseAPI } from '../services/supabase';
import { Student, Absence, Action, ActionType } from '../types';
import { GRADES, ACTION_TYPES } from '../constants';

declare const XLSX: any;

interface ReportsProps {
  onBack: () => void;
}

const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [activeReport, setActiveReport] = useState<'absence' | 'actions' | null>(null);
  
  // Data state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
  const [allActions, setAllActions] = useState<Action[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters state
  const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [selectedAction, setSelectedAction] = useState<ActionType | 'all'>('all');

  // Report state
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      const [studentsData, absencesData, actionsData] = await Promise.all([
        supabaseAPI.getAllStudents(),
        supabaseAPI.getAllAbsences(),
        supabaseAPI.getAllActions()
      ]);
      setAllStudents(studentsData || []);
      setAllAbsences(absencesData || []);
      setAllActions(actionsData || []);
      setLoadingData(false);
    };
    fetchData();
  }, []);
  
  const handleGenerateReport = () => {
    setIsGenerating(true);
    setReportData(null);

    let filteredStudents = allStudents.filter(s => s.grade === selectedGrade);
    if (selectedClass) {
        filteredStudents = filteredStudents.filter(s => s.class === selectedClass);
    }
    const studentIds = new Set(filteredStudents.map(s => s.id));

    if (activeReport === 'absence') {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const absences = allAbsences
            .filter(a => studentIds.has(a.student_id) && new Date(a.absence_date) >= startDate && new Date(a.absence_date) <= endDate)
            .map(a => ({ ...a, student_name: allStudents.find(s => s.id === a.student_id)?.name || 'غير معروف' }))
            .sort((a, b) => new Date(a.absence_date).getTime() - new Date(b.absence_date).getTime());
        setReportData(absences);
    } else if (activeReport === 'actions') {
        let actions = allActions.filter(a => studentIds.has(a.student_id));
        if (selectedAction !== 'all') {
            actions = actions.filter(a => a.type === selectedAction);
        }
        const formattedActions = actions
            .map(a => ({ ...a, student_name: allStudents.find(s => s.id === a.student_id)?.name || 'غير معروف' }))
            .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReportData(formattedActions);
    }
    setIsGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (!reportData || reportData.length === 0) return;

    let dataToExport;
    let filename;
    const getStudentInfo = (student_id: number) => {
        const student = allStudents.find(s => s.id === student_id);
        return student ? { name: student.name, classInfo: `${student.grade} - ${student.class}` } : { name: 'غير معروف', classInfo: ''};
    };

    if (activeReport === 'absence') {
        dataToExport = reportData.map(item => {
            const { name, classInfo } = getStudentInfo(item.student_id);
            return {
                'الطالب': name,
                'الصف - الشعبة': classInfo,
                'تاريخ الغياب': new Date(item.absence_date).toLocaleDateString('ar-EG'),
                'ملاحظات': item.reason || '-',
            };
        });
        filename = `تقرير-الغياب-${selectedGrade}-${selectedClass || 'الكل'}-شهر-${selectedMonth}.xlsx`;
    } else { // actions
        dataToExport = reportData.map(item => {
            const { name, classInfo } = getStudentInfo(item.student_id);
            return {
                'الطالب': name,
                'الصف - الشعبة': classInfo,
                'نوع الإجراء': item.type,
                'تاريخ الإجراء': new Date(item.created_at).toLocaleString('ar-EG'),
                'ملاحظات': item.note || '-',
            };
        });
        filename = `تقرير-الإجراءات-${selectedGrade}-${selectedClass || 'الكل'}-${selectedAction}.xlsx`;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
    XLSX.writeFile(workbook, filename);
  };


  const ReportFilters = () => (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className="text-sm font-medium text-gray-700">الصف</label>
        <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">الشعبة (اختياري)</label>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
          <option value="">كل الشعب</option>
          {[...new Set(allStudents.filter(s => s.grade === selectedGrade).map(s => s.class))].sort().map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {activeReport === 'absence' ? (
        <div>
          <label className="text-sm font-medium text-gray-700">الشهر</label>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" />
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium text-gray-700">نوع الإجراء</label>
          <select value={selectedAction} onChange={e => setSelectedAction(e.target.value as any)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
            <option value="all">جميع الإجراءات</option>
            {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
      <button onClick={handleGenerateReport} disabled={isGenerating} className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 disabled:bg-purple-300 font-semibold flex items-center justify-center">
        <Icon name="chart" className="w-5 h-5 mr-2"/>
        {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
      </button>
    </div>
  );

  if (loadingData) {
    return <div className="text-center p-10">جاري تحميل البيانات الأولية...</div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center"><Icon name="file" className="w-8 h-8 mr-3 text-blue-500" /> التقارير</h1>
        <button onClick={onBack} className="flex items-center text-purple-600 hover:text-purple-800 font-semibold transition-colors">
          <Icon name="arrow-right" className="w-5 h-5 ml-2 transform -scale-x-100" />
          العودة
        </button>
      </div>

      {!activeReport ? (
        <div className="text-center p-10">
          <h2 className="text-xl font-semibold mb-4">اختر نوع التقرير المطلوب</h2>
          <div className="flex justify-center gap-4">
            <button onClick={() => setActiveReport('absence')} className="bg-red-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-red-600 transition-colors">تقرير الغياب</button>
            <button onClick={() => setActiveReport('actions')} className="bg-blue-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-blue-600 transition-colors">تقرير الإجراءات</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="no-print">
            <button onClick={() => { setActiveReport(null); setReportData(null); }} className="text-sm text-gray-600 mb-4 hover:underline">العودة لاختيار التقارير</button>
            <h2 className="text-2xl font-bold mb-4">{activeReport === 'absence' ? 'تقرير الغياب' : 'تقرير الإجراءات'}</h2>
            <ReportFilters />
          </div>
          
          {reportData && (
             <div className="mt-8 printable-area">
                <div className="hidden print:block text-center mb-4">
                  <h2 className="text-xl font-bold">{activeReport === 'absence' ? 'تقرير الغياب' : 'تقرير الإجراءات'}</h2>
                  <p>الصف: {selectedGrade} {selectedClass ? `- الشعبة: ${selectedClass}` : ''}</p>
                   {activeReport === 'absence' && <p>الشهر: {selectedMonth}</p>}
                   {activeReport === 'actions' && <p>نوع الإجراء: {selectedAction === 'all' ? 'الكل' : selectedAction}</p>}
                </div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">نتائج التقرير ({reportData.length})</h3>
                 <div className="flex gap-2 no-print">
                    <button onClick={handlePrint} className="btn-header bg-blue-500"><Icon name="printer" className="w-4 h-4 mr-2"/> طباعة</button>
                    <button onClick={handleExportToExcel} disabled={reportData.length === 0} className="btn-header bg-green-500 disabled:bg-green-300"><Icon name="download" className="w-4 h-4 mr-2"/> تصدير Excel</button>
                </div>
              </div>
              
              <div className="overflow-auto max-h-96">
                {reportData.length === 0 ? <p>لا توجد بيانات تطابق الفلتر المحدد.</p> : (
                  <table className="w-full text-right">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2">الطالب</th>
                        {activeReport === 'absence' && <th className="p-2">تاريخ الغياب</th>}
                        {activeReport === 'actions' && <th className="p-2">نوع الإجراء</th>}
                        {activeReport === 'actions' && <th className="p-2">تاريخ الإجراء</th>}
                        <th className="p-2">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item, index) => (
                        <tr key={item.id || index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{item.student_name}</td>
                          {activeReport === 'absence' && <td className="p-2">{new Date(item.absence_date).toLocaleDateString('ar-EG')}</td>}
                          {activeReport === 'actions' && <td className="p-2">{item.type}</td>}
                          {activeReport === 'actions' && <td className="p-2">{new Date(item.created_at).toLocaleString('ar-EG')}</td>}
                          <td className="p-2">{item.reason || item.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Reports;