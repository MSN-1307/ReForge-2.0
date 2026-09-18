import React from 'react';
import {
  Terminal,
  Layers,
  Sparkles,
  FileCode2,
  Cpu,
  RefreshCw,
  Sun,
  Moon,
  Trash2,
  Upload,
  Play,
  Download,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus
} from 'lucide-react';
import { TARGET_OPTIONS } from './LanguageSelector';

export default function Sidebar({
  currentProject,
  activeTab,
  setActiveTab,
  isMigrating,
  onRunMigration,
  onOpenUpload,
  onDeleteCurrentProject,
  targetFramework,
  setTargetFramework,
  theme,
  toggleTheme
}) {
  const navItems = [
    { id: 'console', label: 'Agent Console', icon: Terminal, badge: isMigrating ? 'Live' : null },
    { id: 'graph', label: 'Architecture Graph', icon: Layers },
    { id: 'chat', label: 'Codebase Chat', icon: Sparkles },
    { id: 'output', label: 'Generated Code', icon: FileCode2 },
    { id: 'diff', label: 'Semantic Diff', icon: Cpu },
    { id: 'verify', label: 'Verification & Repair', icon: RefreshCw },
    { id: 'modernize', label: 'Modernization', icon: Sparkles }
  ];

  const getTargetName = () => {
    const tf = (currentProject?.target_framework || targetFramework || "spring_boot").toLowerCase();
    if (tf.includes("spring") || tf.includes("java")) return "Spring Boot";
    if (tf.includes("fastapi")) return "FastAPI";
    if (tf.includes("flask")) return "Flask";
    if (tf.includes("gin") || tf.includes("go")) return "Go Gin";
    if (tf.includes("express") || tf.includes("node")) return "Express";
    return "Target";
  };

  const isCompleted = currentProject?.status === 'COMPLETED' || currentProject?.status === 'MIGRATED';

  return (
    <aside className="w-64 h-screen shrink-0 border-r flex flex-col justify-between select-none z-30 transition-colors duration-200 bg-white dark:bg-[#0c1220] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm">
      {/* Top Branding Section */}
      <div className="flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20 text-white font-black text-sm">
              RF
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">ReForge</h1>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded border border-teal-500/30">
                  V2
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Autonomous Modernization</p>
            </div>
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>

        {/* Active Project Card */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Project
            </span>
            {currentProject && (
              <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isMigrating ? 'bg-amber-400 animate-ping' : 'bg-teal-500'}`} />
            )}
          </div>

          {currentProject ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]" title={currentProject.name}>
                  {currentProject.name}
                </h3>
              </div>

              {/* Source -> Target Pill */}
              <div className="flex items-center justify-between text-[10px] bg-white dark:bg-slate-950 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono shadow-sm">
                <span className="truncate">{currentProject.source_framework.split('/')[0].trim()}</span>
                <ArrowRight className="w-2.5 h-2.5 text-teal-500 dark:text-teal-400 shrink-0 mx-1" />
                <span className="font-bold text-teal-600 dark:text-teal-300">{getTargetName()}</span>
              </div>

              {/* Target Selector Dropdown */}
              <div className="pt-1">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Target Framework:</label>
                <select
                  value={targetFramework}
                  onChange={(e) => setTargetFramework(e.target.value)}
                  disabled={isMigrating}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-teal-500 shadow-sm"
                >
                  <option value="spring_boot">Java Spring Boot 3</option>
                  <option value="fastapi">Python FastAPI</option>
                  <option value="flask">Python Flask</option>
                  <option value="gin">Go Gin</option>
                  <option value="express">Node.js Express</option>
                </select>
              </div>

              {/* Migrate Action Button */}
              <button
                onClick={onRunMigration}
                disabled={isMigrating}
                className={`w-full mt-1.5 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-bold shadow-md transition ${
                  isMigrating
                    ? 'bg-amber-600 text-white cursor-not-allowed animate-pulse'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20'
                }`}
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Migrating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Migration</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">No active project</p>
              <button
                onClick={onOpenUpload}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center space-x-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions Section */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2 bg-slate-50 dark:bg-[#090d16]">
        {/* Download ZIP Button */}
        {currentProject && isCompleted && (
          <a
            href={`/api/migration/${currentProject.id}/download`}
            download
            className="w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>
        )}

        {/* New Upload / Ingest Button */}
        <button
          onClick={onOpenUpload}
          className="w-full flex items-center justify-center space-x-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload New Project</span>
        </button>

        {/* Reset / Delete Current Folder Option */}
        {currentProject && (
          <button
            onClick={onDeleteCurrentProject}
            className="w-full flex items-center justify-center space-x-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 py-1.5 px-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-500/30 transition shadow-sm"
            title="Delete current project folder and reset workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset / Delete Project</span>
          </button>
        )}
      </div>
    </aside>
  );
}
