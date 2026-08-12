import React from "react";
import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import Pengajuan from "./pages/Pengajuan";
import DaftarPengajuan from "./pages/DaftarPengajuan";
import Laporan from "./pages/Laporan";
import Anggaran from "./pages/Anggaran";
import Panduan from "./pages/Panduan";
import Pengaturan from "./pages/Pengaturan";
import ManajemenUser from "./pages/ManajemenUser";
import Login from "./pages/Login";
import PersetujuanSPPDKPA from "./pages/PersetujuanSPPDKPA";
import PersetujuanSPJKPA from "./pages/PersetujuanSPJKPA";
import ArsipSPJKPA from "./pages/ArsipSPJKPA";
import PersetujuanSPJPPTK from "./pages/PersetujuanSPJPPTK";
import ArsipSPJPPTK from "./pages/ArsipSPJPPTK";
import PersetujuanSPJBendahara from "./pages/PersetujuanSPJBendahara";
import ArsipSPJBendahara from "./pages/ArsipSPJBendahara";
import ArsipSPJPengelola from "./pages/ArsipSPJPengelola";
import PersetujuanSPJPegawai from "./pages/PersetujuanSPJPegawai";
import ArsipSPJPegawai from "./pages/ArsipSPJPegawai";
import ResetPage from "./pages/ResetPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const protect = (el: React.ReactNode, roles?: string[]) => <ProtectedRoute allowedRoles={roles}>{el}</ProtectedRoute>;

export const router = createBrowserRouter([
  { path: "/",           element: <Login /> },
  { path: "/login",      element: <Login /> },
  { path: "/reset",      element: <ResetPage /> },
  { path: "/dashboard",  element: protect(<Dashboard />) },
  { path: "/pengajuan",  element: protect(<Pengajuan />, ['pengelola', 'admin']) },
  { path: "/daftar-pengajuan", element: protect(<DaftarPengajuan />, ['pengelola', 'admin']) },
  { path: "/laporan",    element: protect(<Laporan />, ['pengelola', 'admin']) },
  { path: "/anggaran",   element: protect(<Anggaran />, ['pengelola', 'admin']) },
  { path: "/panduan",    element: protect(<Panduan />, ['pengelola', 'admin']) },
  { path: "/pengaturan", element: protect(<Pengaturan />, ['pengelola', 'admin']) },
  { path: "/arsip-spj-pengelola", element: protect(<ArsipSPJPengelola />, ['pengelola', 'admin']) },
  { path: "/persetujuan-sppd", element: protect(<PersetujuanSPPDKPA />, ['kpa', 'admin']) },
  { path: "/persetujuan-spj", element: protect(<PersetujuanSPJKPA />, ['kpa', 'admin']) },
  { path: "/arsip-spj", element: protect(<ArsipSPJKPA />, ['kpa', 'admin']) },
  { path: "/pptk/persetujuan-spj", element: protect(<PersetujuanSPJPPTK />, ['pptk', 'admin']) },
  { path: "/pptk/arsip-spj", element: protect(<ArsipSPJPPTK />, ['pptk', 'admin']) },
  { path: "/bendahara/persetujuan-spj", element: protect(<PersetujuanSPJBendahara />, ['bendahara', 'admin']) },
  { path: "/bendahara/arsip-spj", element: protect(<ArsipSPJBendahara />, ['bendahara', 'admin']) },
  { path: "/pegawai/persetujuan-spj", element: protect(<PersetujuanSPJPegawai />, ['pegawai', 'admin', 'kpa', 'pptk', 'bendahara', 'pengelola']) },
  { path: "/pegawai/arsip-spj", element: protect(<ArsipSPJPegawai />, ['pegawai', 'admin', 'kpa', 'pptk', 'bendahara', 'pengelola']) },
  { path: "/manajemen-user", element: protect(<ManajemenUser />, ['admin']) },
]);
