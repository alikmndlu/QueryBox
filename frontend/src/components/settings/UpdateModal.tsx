import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, ExternalLink, CheckCircle2, AlertCircle, Sparkles, ArrowUpCircle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { API } from '../../lib/api';
import { UpdateInfo, UpdateProgress } from '../../types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { EventsOn } from '../../../wailsjs/runtime/runtime';

export const UpdateModal: React.FC = () => {
  const { updateModalOpen, setUpdateModalOpen, showToast } = useUIStore();
  const [currentVersion, setCurrentVersion] = useState<string>('v1.0.0');
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    API.getAppVersion().then((v) => setCurrentVersion(v || 'v1.0.0'));
  }, []);

  useEffect(() => {
    try {
      const unsub = EventsOn('update:progress', (p: UpdateProgress) => {
        setProgress(p);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    } catch {
      // Running outside Wails or mock environment
    }
  }, []);

  useEffect(() => {
    if (updateModalOpen && !info && !isChecking) {
      handleCheck();
    }
  }, [updateModalOpen]);

  const handleCheck = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const result = await API.checkForUpdate();
      setInfo(result);
      if (!result.available) {
        showToast(`QueryBox ${result.currentVersion} is the latest version.`, 'info');
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to check for updates. Please verify your internet connection.';
      setError(msg);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!info?.canInstall) return;
    setIsInstalling(true);
    setError(null);
    setProgress({ percent: 0, bytes: 0, total: 0 });
    try {
      const result = await API.installUpdate();
      if (result.openedInstaller) {
        showToast('Installer opened. Follow instructions to finish installation.', 'success');
      } else if (result.restartRequired) {
        showToast('Update downloaded! QueryBox is restarting...', 'success');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to apply update.');
      setIsInstalling(false);
      setProgress(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  return (
    <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
      <DialogContent className="max-w-md bg-[#0d121c] border-[#1b2333] p-0 overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-[#1b2333] bg-[#0a0e17]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-indigo-400" />
              <DialogTitle className="text-sm font-semibold text-white">Check for Updates</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Keep QueryBox up to date with the latest features, database drivers, and bug fixes.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* Version Info Card */}
          <div className="p-3 rounded-lg bg-[#111622] border border-[#1b2333] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Installed Version</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">{currentVersion}</div>
            </div>
            <Button
              onClick={handleCheck}
              disabled={isChecking || isInstalling}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs bg-[#0c101a] border-[#1f293d] hover:bg-[#161f33]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check Now'}</span>
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Up to date status */}
          {info && !info.available && !error && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-emerald-200">You're all set!</div>
                <div className="text-[11px] text-emerald-300/80 mt-0.5">
                  QueryBox {info.currentVersion} is currently the latest version.
                </div>
              </div>
            </div>
          )}

          {/* Update Available Card */}
          {info?.available && (
            <div className="space-y-3 p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-indigo-200">New Release Available!</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  {info.latestVersion}
                </span>
              </div>

              {info.notes && (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Release Notes:</div>
                  <div className="p-2.5 rounded bg-[#090d16] border border-[#161f30] text-[11px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                    {info.notes}
                  </div>
                </div>
              )}

              {/* Progress bar if installing */}
              {isInstalling && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Downloading update...</span>
                    <span>
                      {progress?.percent || 0}% ({formatBytes(progress?.bytes || 0)} / {formatBytes(progress?.total || 0)})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#111622] overflow-hidden border border-[#1d273d]">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progress?.percent || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Install / Download Actions */}
              <div className="pt-2 flex items-center gap-2">
                {info.canInstall ? (
                  <Button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 gap-1.5 shadow-md shadow-emerald-950/40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isInstalling ? 'Downloading & Installing...' : 'Install Update Now'}</span>
                  </Button>
                ) : (
                  <div className="text-[11px] text-amber-400 leading-tight flex-1">
                    {info.installHint || 'Manual download required for this environment.'}
                  </div>
                )}

                <Button
                  onClick={() => API.openReleasePage()}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs bg-[#0c101a] border-[#1f293d] hover:bg-[#161f33]"
                  title="Open GitHub Releases Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Releases</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
