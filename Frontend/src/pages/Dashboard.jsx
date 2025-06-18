import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Welcome to Anacaona Transcript Bridge</h1>
      <Link to="/submit-transcript" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Submit Transcript
      </Link>
    </div>
  );
}