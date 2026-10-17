import React, { useState } from 'react';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export const Layout = ({ activeTab, onSelectTab, notifications, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-150">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        notifications={notifications}
      />

      <div className="flex-1 flex">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
