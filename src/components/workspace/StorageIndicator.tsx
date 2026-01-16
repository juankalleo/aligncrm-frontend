'use client';

import { Workspace } from '@/tipos';

interface StorageIndicatorProps {
  workspace: Workspace;
}

export default function StorageIndicator({ workspace }: StorageIndicatorProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const percentual = workspace.percentualUsoStorage || 0;
  const usado = formatBytes(workspace.storageUsado || 0);
  const limite = formatBytes(workspace.storageLimite || 0);

  // Cores baseadas no percentual de uso
  let barColor = 'bg-blue-500';
  let textColor = 'text-blue-700';
  if (percentual >= 90) {
    barColor = 'bg-red-500';
    textColor = 'text-red-700';
  } else if (percentual >= 75) {
    barColor = 'bg-orange-500';
    textColor = 'text-orange-700';
  } else if (percentual >= 50) {
    barColor = 'bg-yellow-500';
    textColor = 'text-yellow-700';
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Armazenamento</h3>
        <span className={`text-sm font-semibold ${textColor}`}>
          {percentual.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className={`${barColor} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{usado} usados</span>
        <span>{limite} total</span>
      </div>

      {percentual >= 90 && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          ⚠️ Limite de armazenamento quase atingido!
        </div>
      )}
    </div>
  );
}
