import { useState, useEffect } from 'react';
import { Settings, Server, Cpu, CheckCircle, XCircle } from 'lucide-react';

interface ModelStatus {
  available_models: string[];
  device: string;
}

export default function SettingsPage() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  useEffect(() => {
    checkApiStatus();
    checkModelStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/');
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch {
      setApiStatus('offline');
    }
  };

  const checkModelStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/questions/personalized/models');
      if (response.ok) {
        const data = await response.json();
        setModelStatus(data);
      }
    } catch {
      // Ignore errors
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure your Model Paper Generator settings
        </p>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Server className="w-5 h-5" />
          System Status
        </h2>

        <div className="space-y-4">
          {/* API Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Backend API</p>
                <p className="text-sm text-gray-500">http://127.0.0.1:8000</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {apiStatus === 'checking' && (
                <span className="text-gray-500">Checking...</span>
              )}
              {apiStatus === 'online' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">Online</span>
                </>
              )}
              {apiStatus === 'offline' && (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-medium">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Device Status */}
          {modelStatus && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Computing Device</p>
                  <p className="text-sm text-gray-500">For personalized models</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                modelStatus.device === 'cuda' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {modelStatus.device.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Personalized Models */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Personalized Models
        </h2>

        {modelStatus?.available_models && modelStatus.available_models.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modelStatus.available_models.map((model) => (
              <div key={model} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900">{model.toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Model available</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">No personalized models available</p>
            <p className="text-sm text-gray-400 mt-1">
              Train models using the Jupyter notebooks
            </p>
          </div>
        )}
      </div>

      {/* About */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
        <div className="space-y-2 text-gray-600">
          <p><strong>Model Paper Generator</strong> v1.0.0</p>
          <p>AI-powered exam question generation from lecture materials</p>
        </div>
      </div>
    </div>
  );
}
