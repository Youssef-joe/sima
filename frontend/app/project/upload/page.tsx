'use client';
import { useState, useCallback } from 'react';
import { Upload, FileText, Image, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function ProjectUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState('ar');

  const t = {
    ar: {
      title: 'رفع المخططات والملفات',
      subtitle: 'يقبل جميع صيغ الملفات المعمارية',
      dragDrop: 'اسحب الملفات هنا أو انقر للاختيار',
      supportedFormats: 'الصيغ المدعومة: DWG, PDF, JPG, PNG, 3DS, SKP, IFC, RVT',
      analyzing: 'جاري تحليل المخططات...',
      analysisComplete: 'تم تحليل المخططات بنجاح',
      startAnalysis: 'بدء التحليل',
      fileName: 'اسم الملف',
      fileSize: 'حجم الملف',
      status: 'الحالة'
    },
    en: {
      title: 'Upload Plans & Files',
      subtitle: 'Accepts all architectural file formats',
      dragDrop: 'Drag files here or click to select',
      supportedFormats: 'Supported: DWG, PDF, JPG, PNG, 3DS, SKP, IFC, RVT',
      analyzing: 'Analyzing plans...',
      analysisComplete: 'Plans analyzed successfully',
      startAnalysis: 'Start Analysis',
      fileName: 'File Name',
      fileSize: 'File Size',
      status: 'Status'
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'ready',
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    onDrop(selectedFiles);
  };

  const startAnalysis = async () => {
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'analyzing' } : f
      ));
      
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'complete', progress: 100 } : f
      ));
    }
    
    setUploading(false);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <Image className="w-5 h-5" />;
    if (['pdf'].includes(ext)) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getStatusIcon = (status) => {
    if (status === 'analyzing') return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'complete') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t[lang].title}</h1>
          <p className="text-gray-600 mb-8">{t[lang].subtitle}</p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-8 hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">{t[lang].dragDrop}</p>
            <p className="text-sm text-gray-500 mb-4">{t[lang].supportedFormats}</p>
            <input
              type="file"
              multiple
              accept=".dwg,.pdf,.jpg,.jpeg,.png,.3ds,.skp,.ifc,.rvt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              اختيار الملفات
            </label>
          </div>

          {files.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">الملفات المرفوعة</h3>
              <div className="space-y-3">
                {files.map((fileItem) => (
                  <div key={fileItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(fileItem.file.name)}
                      <div>
                        <p className="font-medium">{fileItem.file.name}</p>
                        <p className="text-sm text-gray-500">{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(fileItem.status)}
                      <span className="text-sm text-gray-600">
                        {fileItem.status === 'analyzing' && t[lang].analyzing}
                        {fileItem.status === 'complete' && t[lang].analysisComplete}
                        {fileItem.status === 'ready' && 'جاهز للتحليل'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {!uploading && (
                <button
                  onClick={startAnalysis}
                  className="mt-6 w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t[lang].startAnalysis}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}