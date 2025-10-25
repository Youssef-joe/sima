'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Users, Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [lang, setLang] = useState('ar');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const storedLang = localStorage.getItem('language') || 'ar';
    setLang(storedLang);
    
    // Mock projects data
    setProjects([
      {
        id: 1,
        name: 'مجمع الرياض السكني',
        nameEn: 'Riyadh Residential Complex',
        status: 'approved',
        progress: 100,
        team: 5,
        deadline: '2024-03-15',
        compliance: 95,
        location: 'الرياض'
      },
      {
        id: 2,
        name: 'برج جدة التجاري',
        nameEn: 'Jeddah Commercial Tower',
        status: 'in_review',
        progress: 75,
        team: 8,
        deadline: '2024-04-20',
        compliance: 88,
        location: 'جدة'
      },
      {
        id: 3,
        name: 'مسجد الدمام الكبير',
        nameEn: 'Dammam Grand Mosque',
        status: 'needs_revision',
        progress: 45,
        team: 3,
        deadline: '2024-05-10',
        compliance: 72,
        location: 'الدمام'
      }
    ]);
  }, []);

  const t = {
    ar: {
      title: 'لوحة التحكم',
      newProject: 'مشروع جديد',
      search: 'البحث في المشاريع...',
      filter: 'تصفية',
      projects: 'المشاريع',
      team: 'الفريق',
      deadline: 'الموعد النهائي',
      compliance: 'نسبة المطابقة',
      status: 'الحالة',
      approved: 'معتمد',
      in_review: 'قيد المراجعة',
      needs_revision: 'يحتاج مراجعة',
      view: 'عرض',
      edit: 'تعديل',
      delete: 'حذف',
      stats: {
        total: 'إجمالي المشاريع',
        approved: 'المشاريع المعتمدة',
        pending: 'قيد المراجعة',
        compliance: 'متوسط المطابقة'
      }
    },
    en: {
      title: 'Dashboard',
      newProject: 'New Project',
      search: 'Search projects...',
      filter: 'Filter',
      projects: 'Projects',
      team: 'Team',
      deadline: 'Deadline',
      compliance: 'Compliance',
      status: 'Status',
      approved: 'Approved',
      in_review: 'In Review',
      needs_revision: 'Needs Revision',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      stats: {
        total: 'Total Projects',
        approved: 'Approved Projects',
        pending: 'Under Review',
        compliance: 'Avg Compliance'
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'needs_revision': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'in_review': return <Clock className="w-4 h-4" />;
      case 'needs_revision': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const stats = [
    { label: t[lang].stats.total, value: projects.length, color: 'bg-blue-500' },
    { label: t[lang].stats.approved, value: projects.filter(p => p.status === 'approved').length, color: 'bg-green-500' },
    { label: t[lang].stats.pending, value: projects.filter(p => p.status === 'in_review').length, color: 'bg-yellow-500' },
    { label: t[lang].stats.compliance, value: Math.round(projects.reduce((acc, p) => acc + p.compliance, 0) / projects.length) + '%', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t[lang].title}</h1>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t[lang].newProject}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} opacity-20`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t[lang].search}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {t[lang].filter}
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t[lang].projects}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المشروع
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].compliance}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].team}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].deadline}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lang === 'ar' ? project.name : project.nameEn}
                        </div>
                        <div className="text-sm text-gray-500">{project.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {t[lang][project.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.compliance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{project.compliance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{project.team}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{project.deadline}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}