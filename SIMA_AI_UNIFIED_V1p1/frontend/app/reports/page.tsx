'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Thermometer, Droplets, Wind, Zap, AlertTriangle } from 'lucide-react';

export default function ReportsPage() {
  const [lang, setLang] = useState('ar');
  const [selectedBuilding, setSelectedBuilding] = useState('building1');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') || 'ar';
    setLang(storedLang);
  }, []);

  const t = {
    ar: {
      title: 'تقارير مراقبة الأداء',
      subtitle: 'مراقبة أداء المباني عبر حساسات IoT والتحليل البيئي اليومي',
      buildings: 'المباني',
      performance: 'الأداء',
      sensors: 'الحساسات',
      alerts: 'التنبيهات',
      temperature: 'درجة الحرارة',
      humidity: 'الرطوبة',
      airQuality: 'جودة الهواء',
      energy: 'استهلاك الطاقة',
      materials: 'حالة المواد',
      structural: 'الحالة الإنشائية',
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      optimal: 'مثالي',
      warning: 'تحذير',
      critical: 'حرج',
      recommendations: 'التوصيات',
      lastUpdate: 'آخر تحديث',
      sensorData: 'بيانات الحساسات',
      environmentalAnalysis: 'التحليل البيئي',
      buildingHealth: 'صحة المبنى'
    },
    en: {
      title: 'Performance Monitoring Reports',
      subtitle: 'Monitor building performance via IoT sensors and daily environmental analysis',
      buildings: 'Buildings',
      performance: 'Performance',
      sensors: 'Sensors',
      alerts: 'Alerts',
      temperature: 'Temperature',
      humidity: 'Humidity',
      airQuality: 'Air Quality',
      energy: 'Energy Consumption',
      materials: 'Materials Condition',
      structural: 'Structural Health',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      optimal: 'Optimal',
      warning: 'Warning',
      critical: 'Critical',
      recommendations: 'Recommendations',
      lastUpdate: 'Last Update',
      sensorData: 'Sensor Data',
      environmentalAnalysis: 'Environmental Analysis',
      buildingHealth: 'Building Health'
    }
  };

  const buildings = [
    { id: 'building1', name: 'مجمع الرياض السكني', nameEn: 'Riyadh Residential Complex' },
    { id: 'building2', name: 'برج جدة التجاري', nameEn: 'Jeddah Commercial Tower' },
    { id: 'building3', name: 'مسجد الدمام الكبير', nameEn: 'Dammam Grand Mosque' }
  ];

  const sensorData = {
    temperature: { value: 24.5, unit: '°C', status: 'optimal', trend: 'up' },
    humidity: { value: 45, unit: '%', status: 'optimal', trend: 'down' },
    airQuality: { value: 85, unit: 'AQI', status: 'warning', trend: 'up' },
    energy: { value: 1250, unit: 'kWh', status: 'optimal', trend: 'down' }
  };

  const materialsHealth = [
    { material: lang === 'ar' ? 'الحجر الجيري' : 'Limestone', condition: 95, status: 'optimal' },
    { material: lang === 'ar' ? 'الخشب المعالج' : 'Treated Wood', condition: 88, status: 'optimal' },
    { material: lang === 'ar' ? 'الزجاج المعزول' : 'Insulated Glass', condition: 92, status: 'optimal' },
    { material: lang === 'ar' ? 'العزل الحراري' : 'Thermal Insulation', condition: 76, status: 'warning' }
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      message: lang === 'ar' ? 'ارتفاع طفيف في استهلاك الطاقة - الطابق الثالث' : 'Slight increase in energy consumption - Third floor',
      time: '2 ساعات',
      sensor: 'Energy-03'
    },
    {
      id: 2,
      type: 'info',
      message: lang === 'ar' ? 'تحسن في جودة الهواء بعد تشغيل نظام التهوية' : 'Air quality improved after ventilation system activation',
      time: '4 ساعات',
      sensor: 'AQ-02'
    },
    {
      id: 3,
      type: 'critical',
      message: lang === 'ar' ? 'يحتاج العزل الحراري للفحص - انخفاض الكفاءة' : 'Thermal insulation needs inspection - efficiency drop',
      time: '1 يوم',
      sensor: 'TH-01'
    }
  ];

  const recommendations = [
    lang === 'ar' ? 'فحص العزل الحراري في الجناح الشرقي' : 'Inspect thermal insulation in east wing',
    lang === 'ar' ? 'تحسين نظام التهوية في الطابق الثالث' : 'Improve ventilation system on third floor',
    lang === 'ar' ? 'صيانة دورية لأنظمة الطاقة المتجددة' : 'Regular maintenance for renewable energy systems',
    lang === 'ar' ? 'مراجعة إعدادات التكييف لتوفير الطاقة' : 'Review AC settings for energy savings'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'critical': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t[lang].title}</h1>
          <p className="text-gray-600">{t[lang].subtitle}</p>
        </div>

        {/* Building Selector */}
        <div className="mb-6">
          <select 
            value={selectedBuilding} 
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {buildings.map(building => (
              <option key={building.id} value={building.id}>
                {lang === 'ar' ? building.name : building.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Sensor Data Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(sensorData).map(([key, data]) => (
            <div key={key} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {key === 'temperature' && <Thermometer className="w-5 h-5 text-orange-500" />}
                  {key === 'humidity' && <Droplets className="w-5 h-5 text-blue-500" />}
                  {key === 'airQuality' && <Wind className="w-5 h-5 text-green-500" />}
                  {key === 'energy' && <Zap className="w-5 h-5 text-yellow-500" />}
                  <h3 className="font-medium text-gray-900">{t[lang][key]}</h3>
                </div>
                {data.trend === 'up' ? 
                  <TrendingUp className="w-4 h-4 text-green-500" /> : 
                  <TrendingDown className="w-4 h-4 text-red-500" />
                }
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.value} <span className="text-sm font-normal text-gray-500">{data.unit}</span>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>
                    {t[lang][data.status]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Materials Health */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t[lang].materials}</h3>
            <div className="space-y-4">
              {materialsHealth.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.material}</span>
                    <span className="text-sm text-gray-600">{item.condition}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.condition >= 90 ? 'bg-green-500' : item.condition >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${item.condition}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t[lang].alerts}</h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      alert.type === 'critical' ? 'text-red-500' : 
                      alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">{alert.sensor}</span>
                        <span className="text-xs text-gray-500">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t[lang].recommendations}</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t[lang].environmentalAnalysis}</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {lang === 'ar' ? 'رسم بياني لأداء المبنى على مدار الوقت' : 'Building performance chart over time'}
              </p>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            {t[lang].lastUpdate}: {new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
      </div>
    </div>
  );
}