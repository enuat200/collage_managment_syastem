import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Students } from './pages/Students.jsx';
import { Faculty } from './pages/Faculty.jsx';
import { Academics } from './pages/Academics.jsx';
import { Attendance } from './pages/Attendance.jsx';
import { Exams } from './pages/Exams.jsx';
import { Finance } from './pages/Finance.jsx';
import { Library } from './pages/Library.jsx';
import { Announcements } from './pages/Announcements.jsx';
import { AdminSettings } from './pages/AdminSettings.jsx';
import { LoadingSpinner } from './components/common/LoadingAndEmpty.jsx';

function MainApp() {
  const { isAuthenticated, loading, role } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudentForTranscript, setSelectedStudentForTranscript] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner text="Initializing UniManage College System..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleViewTranscript = (studentId) => {
    setSelectedStudentForTranscript(studentId);
    setActiveTab('exams');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'students':
        return <Students onViewTranscript={handleViewTranscript} />;
      case 'faculty':
        return <Faculty />;
      case 'academics':
        return <Academics />;
      case 'attendance':
        return <Attendance />;
      case 'exams':
        return <Exams initialStudentId={selectedStudentForTranscript} />;
      case 'finance':
        return <Finance />;
      case 'library':
        return <Library />;
      case 'announcements':
        return <Announcements />;
      case 'admin':
        return <AdminSettings />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onSelectTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
