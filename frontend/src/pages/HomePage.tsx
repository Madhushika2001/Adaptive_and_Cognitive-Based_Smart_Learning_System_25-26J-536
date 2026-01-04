import { BookOpen, FileText, Sparkles, Brain, ArrowRight, Clock, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Generate Questions',
    description: 'Create exam questions from your lecture materials using AI',
    icon: Sparkles,
    href: '/generate',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Model Papers',
    description: 'Generate complete examination papers with sections and marking schemes',
    icon: FileText,
    href: '/model-paper',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Upload PDF',
    description: 'Upload your own PDF lecture notes to generate custom questions',
    icon: BookOpen,
    href: '/upload',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Personalized Models',
    description: 'Use models trained on your specific course materials',
    icon: Brain,
    href: '/generate',
    gradient: 'from-orange-500 to-amber-500',
  },
];

const subjects = [
  { 
    id: 'dl', 
    code: 'SE4050',
    name: 'Deep Learning', 
    progress: 75,
    weeks: 14,
    gradient: 'from-violet-600 to-indigo-600'
  },
  { 
    id: 'da', 
    code: 'SE4040',
    name: 'Data Analytics', 
    progress: 60,
    weeks: 12,
    gradient: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'ime', 
    code: 'SE4030',
    name: 'Innovation & Entrepreneurship', 
    progress: 45,
    weeks: 10,
    gradient: 'from-orange-500 to-red-500'
  },
];

const stats = [
  { label: 'Subjects', value: '3', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Question Types', value: '5', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome to CogniLearn
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mb-6">
            Generate high-quality exam questions and model papers from your lecture materials using AI-powered generation.
          </p>
          <Link 
            to="/model-paper"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.href}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Available Subjects */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              to={`/generate?subject=${subject.id}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${subject.gradient} p-6 text-white`}>
                <p className="text-white/80 text-sm font-medium mb-1">{subject.code}</p>
                <h3 className="text-xl font-bold">{subject.name}</h3>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{subject.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${subject.gradient} rounded-full transition-all`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {subject.weeks} weeks
                  </span>
                  <span className="flex items-center gap-1 text-indigo-600 font-medium group-hover:gap-2 transition-all">
                    Generate
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
