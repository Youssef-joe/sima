"use client";
import React, { useState } from "react";
import { Shield, Upload, FileText, Building, ArrowRight } from "lucide-react";

const T = {
  ar: {
    brand: "Sima AI — مشروع جديد",
    title: "إنشاء مشروع جديد",
    projectName: "اسم المشروع",
    projectType: "نوع المشروع",
    location: "الموقع",
    consultant: "الاستشاري",
    region: "المنطقة المعمارية",
    uploadFiles: "رفع الملفات",
    createProject: "إنشاء المشروع",
    projectTypes: {
      residential: "سكني",
      commercial: "تجاري", 
      mixed: "مختلط"
    },
    regions: {
      najdi: "نجدي",
      hejazi: "حجازي",
      asiri: "عسيري"
    }
  },
  en: {
    brand: "Sima AI — New Project",
    title: "Create New Project",
    projectName: "Project Name",
    projectType: "Project Type",
    location: "Location",
    consultant: "Consultant",
    region: "Architectural Region",
    uploadFiles: "Upload Files",
    createProject: "Create Project",
    projectTypes: {
      residential: "Residential",
      commercial: "Commercial",
      mixed: "Mixed Use"
    },
    regions: {
      najdi: "Najdi",
      hejazi: "Hejazi",
      asiri: "Asiri"
    }
  }
};

export default function NewProjectPage() {
  const [lang, setLang] = useState("ar");
  const t = T[lang];
  const rtl = lang === "ar";

  const [formData, setFormData] = useState({
    name: "",
    type: "residential",
    location: "",
    consultant: "",
    region: "najdi"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectId = "PRJ-" + Date.now();
    alert(rtl ? `تم إنشاء المشروع بنجاح!\nرقم المشروع: ${projectId}` : `Project created successfully!\nProject ID: ${projectId}`);
  };

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen bg-[#f6f9ff] text-slate-900">
      <header className="px-6 md:px-10 py-5 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center">
              <Shield className="w-5 h-5 text-white"/>
            </div>
            <div className="font-semibold text-slate-900">{t.brand}</div>
          </div>
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
            className="px-3 py-2 rounded-xl text-sm bg-slate-900 text-white hover:bg-slate-700"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">{t.title}</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t.projectName}</label>
                <input 
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={rtl ? "مجمع الرياض السكني" : "Riyadh Residential Complex"}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t.projectType}</label>
                <select 
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  {Object.entries(t.projectTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t.location}</label>
                <input 
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder={rtl ? "الرياض، حي النرجس" : "Riyadh, Al Narjis"}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t.consultant}</label>
                <input 
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  value={formData.consultant}
                  onChange={(e) => setFormData({...formData, consultant: e.target.value})}
                  placeholder={rtl ? "شركة العمارة المتقدمة" : "Advanced Architecture Co."}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">{t.region}</label>
                <select 
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                >
                  {Object.entries(t.regions).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">{t.uploadFiles}</p>
              <input type="file" multiple className="hidden" id="files" />
              <label htmlFor="files" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer">
                {t.uploadFiles}
              </label>
            </div>

            <div className="text-center">
              <button 
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-700 font-medium"
              >
                {t.createProject}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}