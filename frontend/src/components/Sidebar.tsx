import { BookOpen, FileText, Settings, Home, Sparkles, Brain, HelpCircle } from 'lucide-react';
import logo from '../assets/image_13.png';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Revision', href: '/revision', icon: BookOpen },
  { name: 'Quizzers', href: '/quizzers', icon: Brain },
  { name: 'Model Paper', href: '/model-paper', icon: FileText },
  { name: 'Generate Questions', href: '/generate', icon: Sparkles },
  { name: 'Upload PDF', href: '/upload', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col w-72 bg-[#F2F8F5]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <img src={logo} alt="Logo" className="h-10 w-10" />
        </div>
        <div>
          <span className="text-lg font-bold text-black">CongiLearn</span>
          <p className="text-xs text-black/60">AI Exam Generator</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[#087990]/10 mb-4" />

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = item.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href);
        
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'hover:bg-white/10 hover:text-white'
              }`}
              style={isActive ? { background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)' } : { color: '#087990' }}
            >
              <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : ''}`} style={!isActive ? { color: '#087990' } : undefined} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User/Info Section */}
      <div className="p-4">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">

            <div>
              <p className="text-[#087990] font-medium text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </p>
              <p className="text-[#087990]/60 text-xs flex items-center gap-2">
                <HelpCircle className="h-3.5 w-3.5" />
                Help & Support
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#087990]/10">
        <p className="text-xs text-black/40 text-center">
          Model Paper Generator v1.0
        </p>
      </div>
    </div>
  );
}
