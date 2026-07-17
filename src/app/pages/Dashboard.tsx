import { Navigate } from 'react-router';
import DashboardPengelola from './DashboardPengelola';
import DashboardKPA from './DashboardKPA';
import DashboardPPTK from './DashboardPPTK';
import DashboardBendahara from './DashboardBendahara';

import DashboardPegawai from './DashboardPegawai';

import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-8 text-center">Memuat...</div>;

  if (user?.role === 'pegawai') {
    return <Navigate to="/pegawai/persetujuan-spj" replace />;
  }

  if (user?.role === 'kpa') {
    return <DashboardKPA />;
  }

  if (user?.role === 'pptk') {
    return <DashboardPPTK />;
  }

  if (user?.role === 'bendahara') {
    return <DashboardBendahara />;
  }

  // Default to Pengelola
  return <DashboardPengelola />;
}
