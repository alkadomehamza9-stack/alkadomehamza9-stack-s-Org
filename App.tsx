
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentProfile from './components/StudentProfile';
import SchoolAbsence from './components/SchoolAbsence';
import HighAbsence from './components/HighAbsence';
import Reports from './components/Reports';
import { UserType, View } from './types';
import { Icon } from './components/Icons';

const App: React.FC = () => {
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    const storedUserType = localStorage.getItem('userType') as UserType;
    if (loggedInStatus && storedUserType) {
      setIsLoggedIn(true);
      setUserType(storedUserType);
    }
  }, []);

  const handleLogin = (newUserType: UserType) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userType', newUserType || '');
    setIsLoggedIn(true);
    setUserType(newUserType);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    setIsLoggedIn(false);
    setUserType(null);
    setCurrentView('dashboard');
  };

  const navigateTo = (view: View) => setCurrentView(view);

  const viewStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    navigateTo('studentProfile');
  };
  
  const backToDashboard = () => {
      setSelectedStudentId(null);
      navigateTo('dashboard');
  }

  const activateEmergencyMode = () => {
    const password = prompt('أدخل كلمة المرور لتفعيل وضع الطوارئ:');
    if (password === '654321') {
      setEmergencyMode(true);
      // Here you would also handle sound and notifications
    } else if (password !== null) {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const stopEmergencyMode = () => {
    const password = prompt('أدخل كلمة المرور لإيقاف وضع الطوارئ:');
    if (password === '654321') {
      setEmergencyMode(false);
      // Here you would also stop sounds
    } else if (password !== null) {
      alert('كلمة المرور غير صحيحة');
    }
  };


  const renderView = () => {
    switch (currentView) {
      case 'studentProfile':
        return selectedStudentId ? (
          <StudentProfile 
            studentId={selectedStudentId} 
            onBack={backToDashboard} 
            userType={userType} 
          />
        ) : <Dashboard userType={userType} onLogout={handleLogout} navigateTo={navigateTo} viewStudent={viewStudent} />;
      case 'schoolAbsence':
        return <SchoolAbsence onBack={backToDashboard} />;
      case 'highAbsence':
        return <HighAbsence onBack={backToDashboard} viewStudent={viewStudent} />;
      case 'reports':
        return <Reports onBack={backToDashboard} />;
      case 'dashboard':
      default:
        return <Dashboard userType={userType} onLogout={handleLogout} navigateTo={navigateTo} viewStudent={viewStudent} />;
    }
  };
  
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-gray-100 transition-colors duration-500 ${emergencyMode ? 'bg-red-900 animate-pulse' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100'}`}>
        {emergencyMode && (
            <div className="fixed inset-0 bg-red-600/90 z-50 flex flex-col justify-center items-center text-white p-4">
                <Icon name="warning" className="w-24 h-24 mb-4 animate-ping" />
                <h1 className="text-5xl font-bold mb-4 animate-pulse">وضع الطوارئ</h1>
                <p className="text-2xl mb-8">تم تفعيل وضع الطوارئ في المدرسة</p>
                <button 
                    onClick={stopEmergencyMode} 
                    className="bg-white text-red-600 font-bold py-3 px-8 rounded-lg text-xl hover:bg-gray-200 transition-colors"
                >
                    إيقاف الطوارئ
                </button>
            </div>
        )}

      <div className="p-4 md:p-8">
        {renderView()}
      </div>

       <button 
            onClick={activateEmergencyMode}
            className="fixed bottom-5 right-5 w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-transform z-40 no-print"
            title="تفعيل وضع الطوارئ"
        >
            <Icon name="warning" className="w-10 h-10" />
        </button>
    </div>
  );
};

export default App;
