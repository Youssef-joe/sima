'use client';
import { useState, useEffect } from 'react';
import { Award, QrCode, Download, CheckCircle, XCircle, Clock, FileText, Printer } from 'lucide-react';

export default function AuthorityPage() {
  const [lang, setLang] = useState('ar');
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const storedLang = localStorage.getItem('language') || 'ar';
    setLang(storedLang);
    
    // Mock certificates data
    setCertificates([
      {
        id: 'CERT-2024-001',
        projectName: 'مجمع الرياض السكني',
        projectNameEn: 'Riyadh Residential Complex',
        status: 'approved',
        issueDate: '2024-03-15',
        expiryDate: '2027-03-15',
        compliance: 95,
        qrCode: 'QR123456789',
        authority: 'وزارة الشؤون البلدية والقروية والإسكان',
        authorityEn: 'Ministry of Municipal and Rural Affairs and Housing'
      },
      {
        id: 'CERT-2024-002',
        projectName: 'برج جدة التجاري',
        projectNameEn: 'Jeddah Commercial Tower',
        status: 'pending',
        issueDate: null,
        expiryDate: null,
        compliance: 88,
        qrCode: null,
        authority: 'أمانة محافظة جدة',
        authorityEn: 'Jeddah Municipality'
      },
      {
        id: 'CERT-2024-003',
        projectName: 'مسجد الدمام الكبير',
        projectNameEn: 'Dammam Grand Mosque',
        status: 'rejected',
        issueDate: null,
        expiryDate: null,
        compliance: 72,
        qrCode: null,
        authority: 'أمانة المنطقة الشرقية',
        authorityEn: 'Eastern Province Municipality'
      }
    ]);
  }, []);

  const t = {
    ar: {
      title: 'الجهة المعتمدة - إصدار الشهادات',
      subtitle: 'إصدار شهادات الاعتماد والباركود للمشاريع المطابقة',
      certificates: 'الشهادات',
      projectName: 'اسم المشروع',
      status: 'الحالة',
      compliance: 'نسبة المطابقة',
      issueDate: 'تاريخ الإصدار',
      expiryDate: 'تاريخ الانتهاء',
      authority: 'الجهة المصدرة',
      qrCode: 'رمز الاستجابة السريعة',
      actions: 'الإجراءات',
      approved: 'معتمد',
      pending: 'قيد المراجعة',
      rejected: 'مرفوض',
      download: 'تحميل الشهادة',
      print: 'طباعة',
      view: 'عرض',
      generateCert: 'إصدار شهادة',
      certTitle: 'شهادة مطابقة العمارة السعودية',
      certSubtitle: 'وفقاً للموجهات التصميمية المعتمدة',
      certBody: 'تشهد هذه الوثيقة أن المشروع المعماري المذكور أعلاه يتوافق مع الموجهات التصميمية للعمارة السعودية بنسبة',
      validUntil: 'صالحة حتى',
      digitalSignature: 'التوقيع الرقمي'
    },
    en: {
      title: 'Certification Authority - Certificate Issuance',
      subtitle: 'Issue accreditation certificates and QR codes for compliant projects',
      certificates: 'Certificates',
      projectName: 'Project Name',
      status: 'Status',
      compliance: 'Compliance Rate',
      issueDate: 'Issue Date',
      expiryDate: 'Expiry Date',
      authority: 'Issuing Authority',
      qrCode: 'QR Code',
      actions: 'Actions',
      approved: 'Approved',
      pending: 'Pending Review',
      rejected: 'Rejected',
      download: 'Download Certificate',
      print: 'Print',
      view: 'View',
      generateCert: 'Generate Certificate',
      certTitle: 'Saudi Architecture Compliance Certificate',
      certSubtitle: 'According to Approved Design Guidelines',
      certBody: 'This document certifies that the above-mentioned architectural project complies with Saudi architectural design guidelines at a rate of',
      validUntil: 'Valid Until',
      digitalSignature: 'Digital Signature'
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const generateCertificate = (cert: any) => {
    // This would generate a PDF certificate
    console.log('Generating certificate for:', cert.id);
  };

  const CertificatePreview = ({ cert }: { cert: any }) => (
    <div className="bg-white border-2 border-gray-300 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Award className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t[lang].certTitle}</h1>
        <p className="text-gray-600">{t[lang].certSubtitle}</p>
      </div>

      {/* Certificate Body */}
      <div className="mb-8">
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {lang === 'ar' ? cert.projectName : cert.projectNameEn}
          </h2>
          <p className="text-gray-600 mb-4">
            {t[lang].certBody} <span className="font-bold text-green-600">{cert.compliance}%</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">{t[lang].issueDate}</p>
            <p className="font-semibold">{cert.issueDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t[lang].validUntil}</p>
            <p className="font-semibold">{cert.expiryDate}</p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-gray-600 mb-1">{t[lang].authority}</p>
            <p className="font-semibold">{lang === 'ar' ? cert.authority : cert.authorityEn}</p>
          </div>
          
          {cert.qrCode && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                <QrCode className="w-12 h-12 text-gray-600" />
              </div>
              <p className="text-xs text-gray-500">{cert.qrCode}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center">
        <p className="text-sm text-gray-500">{t[lang].digitalSignature}</p>
        <p className="text-xs text-gray-400 mt-2">Certificate ID: {cert.id}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t[lang].title}</h1>
          <p className="text-gray-600">{t[lang].subtitle}</p>
        </div>

        {/* Certificates Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t[lang].certificates}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].projectName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].compliance}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].issueDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].qrCode}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t[lang].actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lang === 'ar' ? cert.projectName : cert.projectNameEn}
                        </div>
                        <div className="text-sm text-gray-500">{cert.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                        {getStatusIcon(cert.status)}
                        {t[lang][cert.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${cert.compliance >= 90 ? 'bg-green-600' : cert.compliance >= 80 ? 'bg-yellow-600' : 'bg-red-600'}`}
                            style={{ width: `${cert.compliance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{cert.compliance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cert.issueDate || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.qrCode ? (
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-900">{cert.qrCode}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {cert.status === 'approved' ? (
                          <>
                            <button 
                              onClick={() => generateCertificate(cert)}
                              className="text-blue-600 hover:text-blue-900"
                              title={t[lang].download}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900" title={t[lang].print}>
                              <Printer className="w-4 h-4" />
                            </button>
                          </>
                        ) : cert.status === 'pending' ? (
                          <button className="text-green-600 hover:text-green-900" title={t[lang].generateCert}>
                            <Award className="w-4 h-4" />
                          </button>
                        ) : (
                          <button className="text-gray-600 hover:text-gray-900" title={t[lang].view}>
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">معاينة الشهادة</h2>
          <CertificatePreview cert={certificates.find(c => c.status === 'approved') || certificates[0]} />
        </div>
      </div>
    </div>
  );
}