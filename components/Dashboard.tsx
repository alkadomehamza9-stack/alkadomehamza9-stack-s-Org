import React, { useState, useEffect, useMemo } from 'react';
import { supabaseAPI } from '../services/supabase';
import { Student, UserType, View } from '../types';
import { Icon } from './Icons';
import AddStudentModal from './AddStudentModal';
import SettingsModal from './SettingsModal';

interface DashboardProps {
  userType: UserType;
  onLogout: () => void;
  navigateTo: (view: View) => void;
  viewStudent: (studentId: number) => void;
}

const StudentCard: React.FC<{ 
    student: Student; 
    onClick: () => void; 
    onMarkAbsence: () => void; 
    userType: UserType;
    isAbsent: boolean;
    isMarking: boolean;
}> = ({ student, onClick, onMarkAbsence, userType, isAbsent, isMarking }) => {
    return (
        <div 
            className={`bg-white rounded-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 ${isAbsent ? 'border-red-400 bg-red-50' : 'border-transparent hover:border-purple-500'}`}
            onClick={userType === 'full' ? onClick : undefined}
        >
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                {isAbsent && <span className="text-xs font-bold text-red-600 bg-red-200 px-2 py-1 rounded-full">غائب</span>}
            </div>
            <p className="text-sm text-gray-500">{student.grade} - {student.class}</p>
            {userType === 'limited' && (
                <button
                    onClick={(e) => { e.stopPropagation(); onMarkAbsence(); }}
                    disabled={isAbsent || isMarking}
                    className={`mt-3 w-full text-white px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center ${
                        isAbsent || isMarking
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                    <Icon name="calendar" className="w-4 h-4 mr-2" />
                    {isMarking ? 'جاري...' : isAbsent ? 'مسجل غائب' : 'تسجيل غياب'}
                </button>
            )}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ userType, onLogout, navigateTo, viewStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [absentToday, setAbsentToday] = useState<Set<number>>(new Set());
  const [markingAbsenceId, setMarkingAbsenceId] = useState<number | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000); // Increased time for longer error messages
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [studentsData, absencesTodayData] = await Promise.all([
        supabaseAPI.getAllStudents(),
        supabaseAPI.getAbsencesByDate(today)
    ]);

    if (studentsData) {
      setStudents(studentsData);
      if (studentsData.length > 0) {
          const classKeys = [...new Set(studentsData.map(s => `${s.grade}-${s.class}`))].sort();
          if (classKeys.length > 0 && (!activeTab || !classKeys.includes(activeTab))) {
              setActiveTab(classKeys[0]);
          }
      }
    }
    
    if (absencesTodayData) {
        setAbsentToday(new Set(absencesTodayData.map(a => a.student_id)));
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const { filteredStudents, classes, grades } = useMemo(() => {
    const filtered = searchTerm
      ? students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : students;

    const classMap = filtered.reduce((acc, student) => {
        const key = `${student.grade}-${student.class}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    const sortedClasses = Object.keys(classMap).sort();
    const uniqueGrades = [...new Set(students.map(s => s.grade))];
    
    return { filteredStudents: filtered, classes: classMap, grades: uniqueGrades, sortedClasses };
  }, [students, searchTerm]);


  const handleMarkAbsence = async (student: Student) => {
    setMarkingAbsenceId(student.id);
    const today = new Date().toISOString().split('T')[0];
    const newAbsence = { student_id: student.id, absence_date: today };

    const { data: result, error } = await supabaseAPI.addAbsence(newAbsence);

    if (result) {
        setToast({ message: `تم تسجيل غياب الطالب ${student.name} بنجاح.`, type: 'success' });
        setAbsentToday(prev => new Set(prev).add(student.id));
    } else if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
            setToast({ message: `الطالب ${student.name} مسجل غائب بالفعل لهذا اليوم.`, type: 'error' });
            if (!absentToday.has(student.id)) {
                setAbsentToday(prev => new Set(prev).add(student.id));
            }
        } else {
            // Display the actual error from the database to help with debugging (e.g., RLS issues).
            const detailedError = `فشل تسجيل الغياب. السبب: ${error.message || 'خطأ غير معروف'}`;
            setToast({ message: detailedError, type: 'error' });
            console.error('Absence registration error:', error);
        }
    }
    
    setMarkingAbsenceId(null);
  }

  const handleStudentAdded = () => {
    fetchData();
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-10 text-gray-500">جاري تحميل بيانات الطلاب...</div>;
    }

    if (searchTerm) {
        if (filteredStudents.length === 0) {
            return <div className="text-center p-10 text-gray-500">لا يوجد طلاب يطابقون البحث.</div>;
        }
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(student => (
                    <StudentCard 
                        key={student.id} 
                        student={student} 
                        onClick={() => viewStudent(student.id)} 
                        onMarkAbsence={() => handleMarkAbsence(student)} 
                        userType={userType} 
                        isAbsent={absentToday.has(student.id)}
                        isMarking={markingAbsenceId === student.id}
                    />
                ))}
            </div>
        )
    }

    if (!activeTab || !classes[activeTab]) {
        return <div className="text-center p-10 text-gray-500">الرجاء اختيار فصل.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes[activeTab].map(student => (
          <StudentCard 
            key={student.id} 
            student={student} 
            onClick={() => viewStudent(student.id)} 
            onMarkAbsence={() => handleMarkAbsence(student)} 
            userType={userType}
            isAbsent={absentToday.has(student.id)}
            isMarking={markingAbsenceId === student.id}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto">
        {toast && (
            <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white font-semibold z-50 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {toast.message}
            </div>
        )}
        <header className="bg-white rounded-2xl p-6 shadow-lg mb-8 text-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">مدرسة ابن خفاجة</h1>
            <p className="text-xl text-gray-600 mt-2">نظام إدارة الطلاب المتقدم</p>
             <div className="mt-4 flex flex-wrap justify-center gap-2">
                {userType === 'full' && (
                <>
                  <button onClick={() => navigateTo('schoolAbsence')} className="btn-header bg-red-500"><Icon name="calendar" className="w-4 h-4 mr-2"/> غياب المدرسة</button>
                  <button onClick={() => navigateTo('reports')} className="btn-header bg-blue-500"><Icon name="file" className="w-4 h-4 mr-2"/> التقارير</button>
                  <button onClick={() => navigateTo('highAbsence')} className="btn-header bg-yellow-500"><Icon name="warning" className="w-4 h-4 mr-2"/> الغياب المرتفع</button>
                  <button onClick={() => setIsAddStudentModalOpen(true)} className="btn-header bg-green-500"><Icon name="plus" className="w-4 h-4 mr-2"/> إضافة طالب</button>
                </>
                )}
                <button onClick={() => setIsSettingsModalOpen(true)} className="btn-header bg-gray-500"><Icon name="settings" className="w-4 h-4 mr-2"/> الإعدادات</button>
                <button onClick={onLogout} className="btn-header bg-red-600"><Icon name="logout" className="w-4 h-4 mr-2"/> تسجيل الخروج</button>
            </div>
        </header>

        <div className="bg-white rounded-xl p-6 shadow-md mb-8">
            <div className="relative">
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث عن طالب بالاسم..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon name="search" className="w-5 h-5" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
                <p className="text-4xl font-bold text-purple-600">{students.length}</p>
                <p className="text-gray-500 mt-1">إجمالي الطلاب</p>
            </div>
             <div className="bg-white rounded-xl p-6 shadow-md text-center">
                <p className="text-4xl font-bold text-blue-600">{Object.keys(classes).length}</p>
                <p className="text-gray-500 mt-1">إجمالي الشعب</p>
            </div>
             <div className="bg-white rounded-xl p-6 shadow-md text-center">
                <p className="text-4xl font-bold text-indigo-600">{grades.length}</p>
                <p className="text-gray-500 mt-1">إجمالي الصفوف</p>
            </div>
        </div>

        {!searchTerm && (
        <div className="bg-white rounded-xl p-6 shadow-md">
             <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-4 space-x-reverse overflow-x-auto" aria-label="Tabs">
                    {Object.keys(classes).sort().map(classKey => {
                        const [grade, className] = classKey.split('-');
                        return (
                            <button
                                key={classKey}
                                onClick={() => setActiveTab(classKey)}
                                className={`${
                                    activeTab === classKey
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {className}
                            </button>
                        );
                    })}
                </nav>
            </div>
            {renderContent()}
        </div>
        )}
        {searchTerm && renderContent()}

        {userType === 'full' && (
            <AddStudentModal
            isOpen={isAddStudentModalOpen}
            onClose={() => setIsAddStudentModalOpen(false)}
            onStudentAdded={handleStudentAdded}
            />
        )}

        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            userType={userType}
        />
    </div>
  );
};

export default Dashboard;