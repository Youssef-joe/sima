'use client';
import { useState, useEffect, useRef } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Move, Eye, Settings, Download, Upload, Play, Pause } from 'lucide-react';

export default function Studio3D() {
  const [lang, setLang] = useState('ar');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState(2024);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('language') || 'ar';
    setLang(storedLang);
  }, []);

  const t = {
    ar: {
      title: 'الاستوديو ثلاثي الأبعاد',
      subtitle: 'عارض متقدم يحول المخططات إلى 3D ويظهر الفجوات والملاحظات',
      uploadPlan: 'رفع مخطط',
      controls: 'التحكم',
      rotate: 'دوران',
      zoom: 'تكبير',
      move: 'تحريك',
      view: 'عرض',
      settings: 'إعدادات',
      download: 'تحميل',
      simulation: 'محاكاة 10 سنوات',
      play: 'تشغيل',
      pause: 'إيقاف',
      year: 'السنة',
      issues: 'المشاكل المكتشفة',
      recommendations: 'التوصيات',
      materials: 'تحليل المواد',
      environment: 'البيئة الحقيقية',
      compliance: 'نسبة المطابقة',
      gaps: 'الفجوات',
      notes: 'الملاحظات'
    },
    en: {
      title: '3D Studio',
      subtitle: 'Advanced viewer that converts plans to 3D and shows gaps and notes',
      uploadPlan: 'Upload Plan',
      controls: 'Controls',
      rotate: 'Rotate',
      zoom: 'Zoom',
      move: 'Move',
      view: 'View',
      settings: 'Settings',
      download: 'Download',
      simulation: '10-Year Simulation',
      play: 'Play',
      pause: 'Pause',
      year: 'Year',
      issues: 'Issues Found',
      recommendations: 'Recommendations',
      materials: 'Materials Analysis',
      environment: 'Real Environment',
      compliance: 'Compliance Rate',
      gaps: 'Gaps',
      notes: 'Notes'
    }
  };

  const issues = [
    {
      id: 1,
      type: 'ventilation',
      severity: 'high',
      position: { x: 150, y: 200, z: 50 },
      title: lang === 'ar' ? 'تهوية غير كافية' : 'Insufficient Ventilation',
      description: lang === 'ar' ? 'منطقة المعيشة تحتاج تحسين التهوية الطبيعية' : 'Living area needs improved natural ventilation'
    },
    {
      id: 2,
      type: 'privacy',
      severity: 'medium',
      position: { x: 300, y: 150, z: 30 },
      title: lang === 'ar' ? 'خصوصية الفناء' : 'Courtyard Privacy',
      description: lang === 'ar' ? 'الفناء يحتاج حاجز بصري إضافي' : 'Courtyard needs additional visual barrier'
    },
    {
      id: 3,
      type: 'materials',
      severity: 'low',
      position: { x: 100, y: 300, z: 80 },
      title: lang === 'ar' ? 'مواد غير محلية' : 'Non-local Materials',
      description: lang === 'ar' ? 'استخدام مواد محلية مفضل للواجهة' : 'Local materials preferred for facade'
    }
  ];

  const recommendations = [
    lang === 'ar' ? 'إضافة نوافذ علوية للتهوية المتقاطعة' : 'Add clerestory windows for cross ventilation',
    lang === 'ar' ? 'استخدام الحجر الجيري المحلي للواجهة الجنوبية' : 'Use local limestone for south facade',
    lang === 'ar' ? 'تحسين زاوية الظلال في الفناء الداخلي' : 'Improve shadow angles in internal courtyard',
    lang === 'ar' ? 'إضافة عناصر مشربية للحماية من الشمس' : 'Add mashrabiya elements for sun protection'
  ];

  const startSimulation = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentYear(prev => {
        if (prev >= 2034) {
          setIsPlaying(false);
          clearInterval(interval);
          return 2024;
        }
        return prev + 1;
      });
    }, 500);
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
  };

  // Simple 3D visualization simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw building outline
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 50, 300, 200);
      ctx.strokeRect(100, 100, 200, 100);
      
      // Draw issue markers
      issues.forEach((issue, index) => {
        const x = issue.position.x;
        const y = issue.position.y;
        
        // Issue marker
        ctx.fillStyle = issue.severity === 'high' ? '#ef4444' : 
                       issue.severity === 'medium' ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Issue number
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), x, y + 4);
      });
      
      // Draw compliance percentage
      ctx.fillStyle = '#1f2937';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${t[lang].compliance}: 87%`, 20, 30);
      
      // Draw year if simulation is running
      if (isPlaying || currentYear > 2024) {
        ctx.fillStyle = '#3b82f6';
        ctx.font = '20px sans-serif';
        ctx.fillText(`${t[lang].year}: ${currentYear}`, 20, canvas.height - 20);
      }
    };

    draw();
  }, [issues, lang, isPlaying, currentYear, t]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t[lang].title}</h1>
          <p className="text-gray-600">{t[lang].subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Viewer */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Toolbar */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title={t[lang].rotate}>
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title={t[lang].zoom}>
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title={t[lang].zoom}>
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title={t[lang].move}>
                      <Move className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title={t[lang].view}>
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {t[lang].uploadPlan}
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title={t[lang].settings}>
                      <Settings className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title={t[lang].download}>
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3D Canvas */}
              <div className="p-6">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  className="w-full border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>

              {/* Simulation Controls */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{t[lang].simulation}</h3>
                  <div className="flex items-center gap-2">
                    {!isPlaying ? (
                      <button
                        onClick={startSimulation}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {t[lang].play}
                      </button>
                    ) : (
                      <button
                        onClick={pauseSimulation}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        {t[lang].pause}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Issues Panel */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t[lang].issues}</h3>
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div key={issue.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        issue.severity === 'high' ? 'bg-red-500' :
                        issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-sm font-medium">{index + 1}. {issue.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{issue.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Panel */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t[lang].recommendations}</h3>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Meter */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t[lang].compliance}</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang === 'ar' ? 'الهوية المعمارية' : 'Architectural Identity'}</span>
                    <span>87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang === 'ar' ? 'المناخ والبيئة' : 'Climate & Environment'}</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang === 'ar' ? 'السياق العمراني' : 'Urban Context'}</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}