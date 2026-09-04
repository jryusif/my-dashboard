import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Calendar as CalendarIcon, 
  FileJson, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { exportTasksToJson, exportTasksToIcal, parseTasksFromJson } from '../../utils/exportUtils';

export const ExportImportModal = ({ isOpen, onClose }) => {
  const { tasks, setTasks } = useCalendar();
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  if (!isOpen) return null;

  const handleExportJson = () => {
    exportTasksToJson(tasks);
  };

  const handleExportIcal = () => {
    exportTasksToIcal(tasks);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = parseTasksFromJson(event.target.result);
        if (importedTasks.length === 0) {
          setImportStatus({ type: 'error', message: 'No valid tasks found in file.' });
          return;
        }

        const replaceAll = window.confirm(
          `Found ${importedTasks.length} tasks in backup.\n\nClick OK to REPLACE your current tasks, or CANCEL to MERGE them with your existing tasks.`
        );

        if (replaceAll) {
          setTasks(importedTasks);
        } else {
          // Merge avoiding ID duplicates
          setTasks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newToAdd = importedTasks.filter(t => !existingIds.has(t.id));
            return [...newToAdd, ...prev];
          });
        }

        setImportStatus({
          type: 'success',
          message: `Successfully loaded ${importedTasks.length} tasks!`,
        });
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: err.message || 'Failed to read JSON backup file.',
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Data Backup & Calendar Sync
              </h2>
              <p className="text-[11px] text-slate-400">
                Export or restore your schedule anytime
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Export iCal */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <CalendarIcon className="w-4 h-4 text-indigo-500" />
                  Sync with Apple / Google Calendar
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Generates an RFC 5545 compliant <code className="font-mono text-indigo-500">.ics</code> file you can import directly into Google Calendar, Outlook, or Apple Calendar.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportIcal}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export .ics
              </button>
            </div>
          </div>

          {/* Export JSON */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <FileJson className="w-4 h-4 text-emerald-500" />
                  Full JSON Backup
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Download a complete JSON backup of all tasks, checklists, priorities, and dates to keep your data safe.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <Upload className="w-4 h-4 text-amber-500" />
                  Restore from JSON Backup
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Restore tasks from an exported JSON file. You can choose to either merge with existing tasks or overwrite.
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import JSON
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Status Alert */}
          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
