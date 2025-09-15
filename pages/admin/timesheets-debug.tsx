import React from 'react';

const AdminTimesheetsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feuilles de temps - Debug</h1>
        <p className="text-gray-600 mt-2">Version de débogage</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <p>Si vous voyez ce message, la route fonctionne !</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </div>
    </div>
  );
};

export default AdminTimesheetsPage;