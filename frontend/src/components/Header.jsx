import React from 'react';
import { RefreshCw, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import MigrationPipeline from './MigrationPipeline';

export default function Header({
  currentProject,
  isMigrating,
  onResetWorkspace,
  targetFramework
}) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur sticky top-0 z-20 transition-colors">
      <div className="flex items-center justify-between px-6 py-2.5">
        {/* Project Breadcrumb */}
        <div className="flex items-center space-x-2.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Workspace</span>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {currentProject?.name || "No Project"}
          </span>
          {currentProject && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              {currentProject.id}
            </span>
          )}
        </div>

        {/* Quick Action & Status */}
        <div className="flex items-center space-x-3">
          {currentProject && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                currentProject.status === 'COMPLETED' || currentProject.status === 'MIGRATED'
                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                  : isMigrating
                  ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 animate-pulse'
                  : 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-500/30'
              }`}>
                {currentProject.status}
              </span>
            </div>
          )}

          <button
            onClick={onResetWorkspace}
            className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg text-xs transition border border-slate-300 dark:border-slate-700/60 shadow-sm"
            title="Clean workspace & reset for new project"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Workspace</span>
          </button>
        </div>
      </div>

      {/* Migration Stepper Pipeline */}
      <MigrationPipeline
        status={currentProject?.status || "INITIALIZED"}
        isMigrating={isMigrating}
      />
    </header>
  );
}
