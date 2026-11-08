import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Coins, 
  Download, 
  Upload, 
  Mail, 
  Cloud, 
  Database, 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Trash2,
  Share2
} from 'lucide-react';
import { CURRENCIES } from '../../utils/formatters';
import { 
  exportDatabaseToJson, 
  exportExpensesToCsv, 
  restoreBackupFromJson,
  sendBackupToEmail 
} from '../../services/backupService';
import { cloudSyncService, SYNC_STATUS } from '../../services/cloudSyncService';
import { useToast } from '../common/Toast';

export default function SettingsView({
  currency = 'PKR',
  onCurrencyChange,
  expenses = [],
  credits = [],
  categories = [],
  onDataRestored
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Backup state
  const [useEncryption, setUseEncryption] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  // Restore state
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreMode, setRestoreMode] = useState('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [needsPasswordForRestore, setNeedsPasswordForRestore] = useState(false);

  // Cloud Sync state
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

  useEffect(() => {
    async function loadConfig() {
      const cfg = await cloudSyncService.getSyncConfig();
      setSyncConfig(cfg);
    }
    loadConfig();
  }, []);

  const handleExportJson = async () => {
    if (useEncryption && !exportPassword.trim()) {
      showToast('Please enter an encryption password', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportDatabaseToJson(useEncryption ? exportPassword : null);
      showToast(
        `Database backup exported (${res.records} records) ${res.encrypted ? 'with AES-256 Encryption' : ''}`,
        'success'
      );
      setExportPassword('');
    } catch (err) {
      showToast('Export error: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmailBackup = async () => {
    setIsSendingEmail(true);
    try {
      const res = await sendBackupToEmail(useEncryption ? exportPassword : null, recipientEmail);
      if (res.cancelled) {
        showToast('Share cancelled', 'info');
      } else if (res.method === 'share') {
        showToast('Backup shared via native share target / email app!', 'success');
      } else {
        showToast('Backup file downloaded & email client opened!', 'success');
      }
    } catch (err) {
      showToast('Error sending backup: ' + err.message, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setNeedsPasswordForRestore(false);
      setRestorePassword('');
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreFile) {
      showToast('Please select a JSON backup file to restore', 'error');
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
        `Restore successful! Restored ${res.restoredExpenses} expenses, ${res.restoredCredits} accounts, ${res.restoredCategories} categories (Skipped ${res.skippedDuplicates} duplicates).`,
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
        showToast('Backup is encrypted. Enter password to decrypt.', 'info');
      } else if (err.message === 'INVALID_PASSWORD') {
        showToast('Incorrect password for encrypted backup', 'error');
      } else {
        showToast('Restore error: ' + err.message, 'error');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveSyncConfig = async (updated) => {
    setSyncConfig(updated);
    await cloudSyncService.saveSyncConfig(updated);
    showToast('Cloud Sync settings updated', 'success');
  };

  const handleTestCloud = async () => {
    setIsTestingConnection(true);
    try {
      const res = await cloudSyncService.testConnection(syncConfig);
      showToast(res.message, 'success');
    } catch (err) {
      showToast('Connection failed: ' + err.message, 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCloudSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await cloudSyncService.syncNow();
      if (res.success) {
        showToast(`Cloud Sync complete! (${res.count} records)`, 'success');
        setSyncConfig(prev => ({ ...prev, lastSyncTime: res.syncTime }));
      } else {
        showToast(`Sync bypassed: ${res.reason}`, 'info');
      }
    } catch (err) {
      showToast('Cloud sync error: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Settings &amp; Backup Center
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Offline-First Security
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage currency preferences, 1-click encrypted backups, email export, and cloud sync hooks.
        </p>
      </div>

      {/* Currency Preference Card */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Default Currency</h3>
            <p className="text-xs text-slate-400">Select currency for all financial cards and reports</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {CURRENCIES.map(curr => {
            const isSelected = currency === curr.code;
            return (
              <button
                key={curr.code}
                onClick={() => onCurrencyChange(curr.code)}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-lg font-black block text-emerald-400">{curr.symbol}</span>
                <span className="text-xs font-bold block mt-1">{curr.code}</span>
                <span className="text-[10px] text-slate-400 block truncate">{curr.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup & Email Sharing Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export & Email Backup Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Export &amp; Send Backup</h3>
                <p className="text-xs text-slate-400">Download to device storage or send directly to email</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed my-3">
              Exports your entire local IndexedDB: <strong>{expenses.length} expenses</strong>, <strong>{credits.length} credit/debt accounts</strong>, and <strong>{categories.length} categories</strong>.
            </p>

            {/* AES-256 GCM Encryption Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 mb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  AES-256 GCM Password Encryption
                </span>
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                />
              </label>

              {useEncryption && (
                <div>
                  <input
                    type="password"
                    placeholder="Enter backup encryption password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-amber-400 mt-1 block">
                    Keep password safe; needed to decrypt upon restore.
                  </span>
                </div>
              )}
            </div>

            {/* Optional Email Recipient */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recipient Email (Optional for "Send to Email")
              </label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleSendEmailBackup}
              disabled={isSendingEmail}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Mail className="w-4 h-4 stroke-[2.5]" />
              {isSendingEmail ? 'Preparing Email Backup...' : 'Send Backup to Email / Share'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON Backup
              </button>
              <button
                onClick={() => exportExpensesToCsv()}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Database Restore Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Database Restore</h3>
                <p className="text-xs text-slate-400">Restore JSON backup with conflict detection</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed my-3">
              Upload a previous Expensio JSON file. Duplicate entries are matched and prevented automatically.
            </p>

            <div className="space-y-3 mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
              />

              <div className="flex items-center gap-4 text-xs pt-1">
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

              {needsPasswordForRestore && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 animate-scale-up">
                  <label className="block text-xs font-semibold text-amber-300">
                    Backup is Encrypted: Enter Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter backup password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleExecuteRestore}
            disabled={!restoreFile || isRestoring}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            {isRestoring ? 'Restoring Database...' : 'Restore into Local Database'}
          </button>
        </div>
      </div>

      {/* Cloud Sync Placeholder Hook */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Online &amp; Cloud Sync Adapter</h3>
              <p className="text-xs text-slate-400">Supabase, Firebase, or Google Drive remote storage hooks</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200">
            <input
              type="checkbox"
              checked={syncConfig.enabled}
              onChange={(e) => handleSaveSyncConfig({ ...syncConfig, enabled: e.target.checked })}
              className="w-4 h-4 text-emerald-500 rounded bg-slate-800"
            />
            Enable Cloud Sync
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Provider</label>
            <select
              disabled={!syncConfig.enabled}
              value={syncConfig.provider}
              onChange={(e) => handleSaveSyncConfig({ ...syncConfig, provider: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none disabled:opacity-50"
            >
              <option value="supabase">Supabase Storage / REST</option>
              <option value="google_drive">Google Drive Cloud Hook</option>
              <option value="firebase">Firebase Firestore</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Endpoint URL</label>
            <input
              type="url"
              disabled={!syncConfig.enabled}
              placeholder="https://your-project.supabase.co"
              value={syncConfig.endpoint}
              onChange={(e) => setSyncConfig({ ...syncConfig, endpoint: e.target.value })}
              onBlur={() => handleSaveSyncConfig(syncConfig)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">API Key / Token</label>
            <input
              type="password"
              disabled={!syncConfig.enabled}
              placeholder="Bearer token or anon key"
              value={syncConfig.apiKey}
              onChange={(e) => setSyncConfig({ ...syncConfig, apiKey: e.target.value })}
              onBlur={() => handleSaveSyncConfig(syncConfig)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            {syncConfig.lastSyncTime ? `Last synced: ${new Date(syncConfig.lastSyncTime).toLocaleString()}` : 'No cloud sync performed yet'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestCloud}
              disabled={!syncConfig.enabled || isTestingConnection}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleCloudSyncNow}
              disabled={!syncConfig.enabled || isSyncing}
              className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
