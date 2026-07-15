import { Bell, User, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { logActivity } from '../utils/activityStore';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user data from localStorage
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Log before removing user
    if (user) {
      logActivity('logout', `${user.nama} Logout`, 'Sistem');
    }
    // Clear user data from localStorage
    localStorage.removeItem('user');
    // Redirect to login
    navigate('/login');
  };

  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-xl z-50">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold tracking-tight text-[#083344]">SIM Perjalanan Dinas Berau</h1>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors relative">
          <Bell className="w-5 h-5 text-[#164E63]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 relative" ref={dropdownRef}>
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold leading-none">{user?.nama || 'User'}</p>
            <p className="text-xs text-slate-500">NIP. {user?.nip || '-'}</p>
          </div>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="hover:bg-slate-100 transition-colors rounded-full p-0.5"
          >
            <User className="w-8 h-8 text-[#164E63]" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}