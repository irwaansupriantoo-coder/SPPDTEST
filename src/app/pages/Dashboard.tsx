import { Navigate } from 'react-router';
import DashboardPengelola from './DashboardPengelola';
import DashboardKPA from './DashboardKPA';
import DashboardPPTK from './DashboardPPTK';
import DashboardBendahara from './DashboardBendahara';

import DashboardPegawai from './DashboardPegawai';

export default function Dashboard() {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

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
