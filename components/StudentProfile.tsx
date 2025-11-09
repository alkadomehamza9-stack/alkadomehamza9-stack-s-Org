import React, { useState, useEffect, useCallback } from 'react';
import { supabaseAPI } from '../services/supabase';
import { Student, Absence, Action, UserType } from '../types';
import { Icon } from './Icons';
import { ACTION_BADGE_CLASSES } from '../constants';
import EditStudentModal from './EditStudentModal';
import AddAbsenceModal from './AddAbsenceModal';
import AddActionModal from './AddActionModal';

declare const XLSX: any;

interface StudentProfileProps {
  studentId: number;
  onBack: () => void;
  userType: UserType;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, onBack, userType }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAbsenceModalOpen, setIsAddAbsenceModalOpen] = useState(false);
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const studentData = await supabaseAPI.getStudentById(studentId);
    const absencesData = await supabaseAPI.getStudentAbsences(studentId);
    const actionsData = await supabaseAPI.getStudentActions(studentId);
    
    setStudent(studentData);
    setAbsences(absencesData || []);
    setActions(actionsData || []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (!student) return;

    // 1. Student Info Sheet
    const profileData = [
      ['الاسم', student.name],
      ['الصف', student.grade],
      ['الشعبة', student.class],
      ['الرقم الوطني', student.national_id || '-'],
      ['تاريخ الميلاد', student.birth_date || '-'],
      ['العنوان', student.address || '-'],
      ['اسم ولي الأمر', student.parent_name || '-'],
      ['هاتف ولي الأمر 1', student.phone1 || '-'],
      ['هاتف ولي الأمر 2', student.phone2 || '-'],
      ['البريد الإلكتروني', student.email || '-'],
    ];
    const profileWs = XLSX.utils.aoa_to_sheet(profileData);

    // 2. Absences Sheet
    const absencesData = absences.map(a => ({
      'التاريخ': new Date(a.absence_date).toLocaleDateString('ar-EG'),
      'السبب': a.reason || '-',
    }));
    const absencesWs = XLSX.utils.json_to_sheet(absencesData);

    // 3. Actions Sheet
    const actionsData = actions.map(ac => ({
      'النوع': ac.type,
      'التاريخ': new Date(ac.created_at).toLocaleString('ar-EG'),
      'الملاحظات': ac.note || '-',
    }));
    const actionsWs = XLSX.utils.json_to_sheet(actionsData);

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, profileWs, 'ملف الطالب');
    XLSX.utils.book_append_sheet(wb, absencesWs, 'سجل الغياب');
    XLSX.utils.book_append_sheet(wb, actionsWs, 'سجل الإجراءات');

    XLSX.writeFile(wb, `${student.name} - تقرير.xlsx`);
  };

  if (loading) {
    return <div className="text-center p-10">جاري تحميل ملف الطالب...</div>;
  }

  if (!student) {
    return <div className="text-center p-10 text-red-500">لم يتم العثور على الطالب.</div>;
  }

  const InfoField: React.FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-semibold text-purple-600">{label}</p>
        <p className="text-gray-800">{value || '-'}</p>
    </div>
  );
  
  return (
    <>
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 printable-area">
        <div className="flex justify-between items-center mb-6 no-print">
          <button onClick={onBack} className="flex items-center text-purple-600 hover:text-purple-800 font-semibold transition-colors">
            <Icon name="arrow-right" className="w-5 h-5 ml-2 transform -scale-x-100" />
            العودة للقائمة
          </button>
          {userType === 'full' && (
            <div className="flex gap-2">
              <button onClick={() => setIsEditModalOpen(true)} className="btn-header bg-yellow-500"><Icon name="edit" className="w-4 h-4 mr-2"/> تعديل</button>
              <button onClick={handlePrint} className="btn-header bg-blue-500"><Icon name="printer" className="w-4 h-4 mr-2"/> طباعة</button>
              <button onClick={handleExportToExcel} className="btn-header bg-green-500"><Icon name="download" className="w-4 h-4 mr-2"/> تصدير Excel</button>
            </div>
          )}
        </div>

        <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl p-8 mb-8 flex items-center gap-6">
          <img src={`https://i.pravatar.cc/100?u=${student.id}`} alt="صورة الطالب" className="w-24 h-24 rounded-full border-4 border-white shadow-md"/>
          <div>
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <p className="text-purple-200 text-lg">{student.grade} - {student.class}</p>
            <p className="text-purple-200">الرقم الوطني: {student.national_id || '-'}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">المعلومات الشخصية والاتصال</h2>
              <div className="grid grid-cols-2 gap-4">
                  <InfoField label="تاريخ الميلاد" value={student.birth_date} />
                  <InfoField label="العنوان" value={student.address} />
                  <InfoField label="اسم ولي الأمر" value={student.parent_name} />
                  <InfoField label="هاتف ولي الأمر 1" value={student.phone1} />
                  <InfoField label="هاتف ولي الأمر 2" value={student.phone2} />
                  <InfoField label="البريد الإلكتروني" value={student.email} />
              </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-bold text-gray-800">سجل الغياب ({absences.length})</h2>
                  {userType === 'full' && (
                      <button onClick={() => setIsAddAbsenceModalOpen(true)} className="btn-header bg-red-500 text-sm py-1 px-3 no-print"><Icon name="calendar" className="w-4 h-4 mr-1"/> تسجيل غياب</button>
                  )}
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {absences.length > 0 ? absences.map(absence => (
                      <div key={absence.id} className="bg-white p-3 rounded-lg shadow-sm border-r-4 border-red-400">
                          <p className="font-semibold text-gray-700">{new Date(absence.absence_date).toLocaleDateString('ar-EG')}</p>
                          <p className="text-sm text-gray-500">{absence.reason || 'لا يوجد سبب مسجل'}</p>
                      </div>
                  )) : <p className="text-gray-500">لا توجد غيابات مسجلة.</p>}
              </div>
          </div>

          <div className="md:col-span-2 bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-bold text-gray-800">سجل الإجراءات ({actions.length})</h2>
                  {userType === 'full' && (
                      <button onClick={() => setIsAddActionModalOpen(true)} className="btn-header bg-green-500 text-sm py-1 px-3 no-print"><Icon name="plus" className="w-4 h-4 mr-1"/> إضافة إجراء</button>
                  )}
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {actions.length > 0 ? actions.map(action => (
                      <div key={action.id} className="bg-white p-4 rounded-lg shadow-sm border-r-4 border-purple-400">
                          <div className="flex justify-between items-start">
                              <div>
                                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${ACTION_BADGE_CLASSES[action.type]}`}>
                                      {action.type}
                                  </span>
                                  <p className="text-sm text-gray-500 mt-2">{new Date(action.created_at).toLocaleString('ar-EG')}</p>
                              </div>
                            {action.note && <p className="text-gray-700 mt-1 max-w-md">{action.note}</p>}
                          </div>
                      </div>
                  )) : <p className="text-gray-500">لا توجد إجراءات مسجلة.</p>}
              </div>
          </div>
        </div>
      </div>
      {userType === 'full' && student && (
        <>
            <EditStudentModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                student={student}
                onStudentUpdated={fetchData}
            />
            <AddAbsenceModal 
                isOpen={isAddAbsenceModalOpen}
                onClose={() => setIsAddAbsenceModalOpen(false)}
                studentId={studentId}
                onAbsenceAdded={fetchData}
            />
            <AddActionModal 
                isOpen={isAddActionModalOpen}
                onClose={() => setIsAddActionModalOpen(false)}
                studentId={studentId}
                onActionAdded={fetchData}
            />
        </>
      )}
    </>
  );
};

export default StudentProfile;