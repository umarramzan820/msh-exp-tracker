import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Cloud, 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Server, 
  Key, 
  Wifi, 
  WifiOff, 
  Layers 
} from 'lucide-react';
import { exportDatabaseToJson, exportExpensesToCsv, restoreBackupFromJson } from '../../services/backupService';
import { cloudSyncService, SYNC_STATUS } from '../../services/cloudSyncService';
import { useToast } from '../common/Toast';

export default function BackupSyncView({ expenses, categories, onDataRestored }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Export settings
  const [useEncryption, setUseEncryption] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Restore settings
  const [restoreMode, setRestoreMode] = useState('merge');
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [needsPasswordForRestore, setNeedsPasswordForRestore] = useState(false);

  // Cloud Sync settings
  const [syncConfig, setSyncConfig] = useState({
    enabled: false,
    provider: 'supabase',
    endpoint: '',
    apiKey: '',
    autoSync: false,
    lastSyncTime: null
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: SYNC_STATUS.IDLE });

  // Load cloud sync config on mount
  useEffect(() => {
    async function loadConfig() {
      const cfg = await cloudSyncService.getSyncConfig();
      setSyncConfig(cfg);
    }
    loadConfig();

    const unsubscribe = cloudSyncService.subscribe((statusObj) => {
      setSyncStatus(statusObj);
    });
    return unsubscribe;
  }, []);

  // Handle Export JSON
  const handleExportJson = async () => {
    if (useEncryption && !exportPassword.trim()) {
      showToast('Please enter an encryption password', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportDatabaseToJson(useEncryption ? exportPassword : null);
      showToast(
        `Export complete! ${res.records} expenses exported ${res.encrypted ? '(AES Encrypted)' : ''}`,
        'success'
      );
      setExportPassword('');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      await exportExpensesToCsv();
      showToast('Exported expenses to CSV', 'success');
    } catch (err) {
      showToast('CSV export failed: ' + err.message, 'error');
    }
  };

  // Handle File Selected for Restore
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setNeedsPasswordForRestore(false);
      setRestorePassword('');
    }
  };

  // Handle Restore
  const handleExecuteRestore = async () => {
    if (!restoreFile) {
      showToast('Please select a backup JSON file to restore', 'error');
      return;
    }

    setIsRestoring(true);
    try {
      const fileText = await restoreFile.text();
      const res = await restoreBackupFromJson(
        fileText,
        restorePassword.trim() || null,
        restoreMode
      );

      showToast(
        `Restore successful! Added ${res.restoredExpenses} expenses, ${res.restoredCategories} categories (Skipped ${res.skippedDuplicates} duplicates).`,
        'success'
      );

      setRestoreFile(null);
      setRestorePassword('');
      setNeedsPasswordForRestore(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onDataRestored) onDataRestored();
    } catch (err) {
      if (err.message === 'PASSWORD_REQUIRED') {
        setNeedsPasswordForRestore(true);
        showToast('This backup is encrypted. Please enter the password.', 'info');
      } else if (err.message === 'INVALID_PASSWORD') {
        showToast('Incorrect password for encrypted backup', 'error');
      } else {
        showToast('Restore error: ' + err.message, 'error');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Save Cloud Sync Config
  const handleSaveSyncConfig = async (updated) => {
    setSyncConfig(updated);
    await cloudSyncService.saveSyncConfig(updated);
    showToast('Cloud Sync settings saved', 'success');
  };

  // Test Cloud Connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await cloudSyncService.testConnection(syncConfig);
      showToast(res.message, 'success');
    } catch (err) {
      showToast('Connection test failed: ' + err.message, 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Manual Cloud Sync
  const handleCloudSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await cloudSyncService.syncNow();
      if (res.success) {
        showToast(`Cloud Sync successful! Synced ${res.count} records.`, 'success');
        setSyncConfig(prev => ({ ...prev, lastSyncTime: res.syncTime }));
      } else {
        showToast(`Sync bypassed: ${res.reason}`, 'info');
      }
    } catch (err) {
      showToast('Cloud sync failed: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Pre-fill demo supabase configuration helper
  const handleFillDemoSupabase = () => {
    const demo = {
      ...syncConfig,
      enabled: true,
      provider: 'supabase',
      endpoint: 'https://xyzcompany.supabase.co',
      apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key'
    };
    handleSaveSyncConfig(demo);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Dual Backup &amp; Cloud Sync
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Offline-First Architecture
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Pure offline storage in Dexie IndexedDB with one-click encrypted backups, duplicate-safe restore, and cloud sync adapters.
        </p>
      </div>

      {/* Storage Health & Architecture Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Offline Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-400" /> Pure Offline Active
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero network dependency for reading and recording expenses.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Local Records</span>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">IndexedDB</span>
          </div>
          <div className="text-lg font-bold text-white">
            {expenses.length} Expenses • {categories.length} Categories
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Indexed with high performance B-tree query support.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cloud Sync Status</span>
            {syncConfig.enabled ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" /> Enabled
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" /> Standalone
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-white capitalize">
            {syncConfig.enabled ? syncConfig.provider : 'Local Only'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {syncConfig.lastSyncTime ? `Last synced: ${new Date(syncConfig.lastSyncTime).toLocaleTimeString()}` : 'No cloud sync performed yet'}
          </p>
        </div>
      </div>

      {/* Offline Backup & Restore Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Offline Export */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Offline Export Backup</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Download your entire financial history directly to your device storage. Works 100% offline without sending data to any external server.
            </p>

            {/* Encryption Toggle */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 mb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  AES-256 GCM Password Encryption
                </span>
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/20 bg-slate-800 border-slate-700"
                />
              </label>

              {useEncryption && (
                <div>
                  <input
                    type="password"
                    placeholder="Enter backup encryption password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-amber-400 mt-1 block">
                    Important: Remember this password. Without it, the backup cannot be decrypted!
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleExportJson}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating...' : 'Export JSON Backup'}
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              <FileText className="w-4 h-4 inline mr-1" /> Export CSV
            </button>
          </div>
        </div>

        {/* Section 2: Offline Restore with Duplicate Prevention */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-base text-white">Offline Restore Backup</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Restore a JSON backup file into your local IndexedDB with built-in duplicate prevention and integrity checks.
            </p>

            {/* File Upload & Mode */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              {/* Mode choice: Merge vs Replace */}
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                    className="text-emerald-500"
                  />
                  Merge &amp; Skip Duplicates
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 font-medium">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="replace"
                    checked={restoreMode === 'replace'}
                    onChange={() => setRestoreMode('replace')}
                    className="text-emerald-500"
                  />
                  Clean Replace All
                </label>
              </div>

              {/* Encrypted Password Input if required */}
              {needsPasswordForRestore && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <label className="block text-xs font-semibold text-amber-300">
                    Backup is Encrypted: Enter Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter backup password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleExecuteRestore}
            disabled={!restoreFile || isRestoring}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:pointer-events-none text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            {isRestoring ? 'Restoring Database...' : 'Restore into Local Database'}
          </button>
        </div>
      </div>

      {/* Online / Cloud Sync Integration Options */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Online &amp; Cloud Sync Adapter</h3>
            </div>
            <p className="text-xs text-slate-400">
              Sync across multiple devices via Supabase, Firebase REST, or custom cloud endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFillDemoSupabase}
              className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 font-semibold"
            >
              Fill Demo Config
            </button>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={syncConfig.enabled}
                onChange={(e) => handleSaveSyncConfig({ ...syncConfig, enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-500 rounded bg-slate-800"
              />
              Enable Cloud Sync
            </label>
          </div>
        </div>

        {/* Cloud Config Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Provider */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cloud Provider Adapter
            </label>
            <select
              disabled={!syncConfig.enabled}
              value={syncConfig.provider}
              onChange={(e) => handleSaveSyncConfig({ ...syncConfig, provider: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none disabled:opacity-50"
            >
              <option value="supabase">Supabase Adapter (PostgreSQL REST)</option>
              <option value="firebase">Firebase / Cloud Firestore REST</option>
              <option value="custom_rest">Custom Webhook / JSON Storage Endpoint</option>
            </select>
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Endpoint URL
            </label>
            <input
              type="url"
              disabled={!syncConfig.enabled}
              placeholder="https://your-project.supabase.co"
              value={syncConfig.endpoint}
              onChange={(e) => setSyncConfig({ ...syncConfig, endpoint: e.target.value })}
              onBlur={() => handleSaveSyncConfig(syncConfig)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              API Key / Anon Token
            </label>
            <input
              type="password"
              disabled={!syncConfig.enabled}
              placeholder="eyJhbGciOi... (or token)"
              value={syncConfig.apiKey}
              onChange={(e) => setSyncConfig({ ...syncConfig, apiKey: e.target.value })}
              onBlur={() => handleSaveSyncConfig(syncConfig)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Sync Actions & Test */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
            <input
              type="checkbox"
              disabled={!syncConfig.enabled}
              checked={syncConfig.autoSync}
              onChange={(e) => handleSaveSyncConfig({ ...syncConfig, autoSync: e.target.checked })}
              className="w-4 h-4 text-emerald-500 rounded bg-slate-800 disabled:opacity-50"
            />
            Auto-sync in background on change
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={!syncConfig.enabled || isTestingConnection}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleCloudSyncNow}
              disabled={!syncConfig.enabled || isSyncing}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
