import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import GuestLayout from './components/layout/GuestLayout';
import PublicRequestView from './pages/guest/PublicRequestView';
import RequestView from './pages/dashboard/RequestView';
import NewRequest from './pages/dashboard/NewRequest';
import RequestDetail from './pages/dashboard/RequestDetail';

function App() {
  return (
    <Router basename="/app">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/inbox" replace />} />
        <Route path="/index.html" element={<Navigate to="/dashboard/inbox" replace />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="inbox" element={<RequestView title="Inbox" filterStatus="" />} />
          <Route path="all" element={<RequestView title="All Requests" filterStatus="all" />} />
          <Route path="drafts" element={<RequestView title="Drafts" filterStatus="draft" />} />
          <Route path="sent" element={<RequestView title="Sent" filterStatus="sent" />} />
          <Route path="responded" element={<RequestView title="Responded" filterStatus="responded" />} />
          <Route path="expired" element={<RequestView title="Expired" filterStatus="expired" />} />
          <Route path="completed" element={<RequestView title="Completed" filterStatus="completed" />} />
          <Route path="archived" element={<RequestView title="Archived" filterStatus="archived" />} />
          <Route path="trash" element={<RequestView title="Trash" filterStatus="trash" />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="new" element={<NewRequest />} />
          
          <Route path="profile" element={<div>Profile Page (Coming Soon)</div>} />
        </Route>
        {/* Guest Portal Routes */}
        <Route path="/p" element={<GuestLayout />}>
           <Route path=":id" element={<PublicRequestView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
