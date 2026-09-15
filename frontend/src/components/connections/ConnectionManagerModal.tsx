import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Save,
  Radio,
  X,
} from 'lucide-react';
import { useConnectionStore } from '../../store/useConnectionStore';
import { ConnectionProfile, SQLDialect } from '../../types';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const DEFAULT_PORTS: Record<string, number> = {
  postgresql: 5432,
  mysql: 3306,
  sqlite: 0,
  sqlserver: 1433,
};

export const ConnectionManagerModal: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    connectionModalOpen,
    setConnectionModalOpen,
    createProfile,
    updateProfile,
    deleteProfile,
    testProfile,
    isTesting,
  } = useConnectionStore();

  const [selectedId, setSelectedId] = useState<string | null>(activeProfileId || (profiles[0]?.id ?? null));
  const [isCreatingNew, setIsCreatingNew] = useState(profiles.length === 0);

  const [formName, setFormName] = useState('Local Postgres');
  const [formDriver, setFormDriver] = useState<SQLDialect>('postgresql');
  const [formHost, setFormHost] = useState('localhost');
  const [formPort, setFormPort] = useState(5432);
  const [formDatabase, setFormDatabase] = useState('postgres');
  const [formUsername, setFormUsername] = useState('postgres');
  const [formPassword, setFormPassword] = useState('');
  const [formSslMode, setFormSslMode] = useState('disable');
  const [formReadOnly, setFormReadOnly] = useState(true);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const selectProfile = (p: ConnectionProfile) => {
    setSelectedId(p.id);
    setIsCreatingNew(false);
    setFormName(p.name);
    setFormDriver(p.driver);
    setFormHost(p.host);
    setFormPort(p.port);
    setFormDatabase(p.database);
    setFormUsername(p.username);
    setFormPassword(p.password || '');
    setFormSslMode(p.sslMode || 'disable');
    setFormReadOnly(p.readOnly ?? true);
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setSelectedId(null);
    setFormName('New Database Connection');
    setFormDriver('postgresql');
    setFormHost('localhost');
    setFormPort(5432);
    setFormDatabase('postgres');
    setFormUsername('postgres');
    setFormPassword('');
    setFormSslMode('disable');
    setFormReadOnly(true);
  };

  const handleDriverChange = (driver: SQLDialect) => {
    setFormDriver(driver);
    setFormPort(DEFAULT_PORTS[driver] || 5432);
    if (driver === 'sqlite' && (!formDatabase || formDatabase === 'postgres' || formDatabase === 'mysql')) {
      setFormDatabase('querybox_local.db');
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    if (isCreatingNew) {
      const created = await createProfile({
        name: formName.trim(),
        driver: formDriver,
        host: formHost.trim(),
        port: Number(formPort),
        database: formDatabase.trim(),
        username: formUsername.trim(),
        password: formPassword,
        sslMode: formSslMode,
        readOnly: formReadOnly,
      });
      selectProfile(created);
    } else if (selectedId) {
      const existing = profiles.find((p) => p.id === selectedId);
      if (existing) {
        const updated: ConnectionProfile = {
          ...existing,
          name: formName.trim(),
          driver: formDriver,
          host: formHost.trim(),
          port: Number(formPort),
          database: formDatabase.trim(),
          username: formUsername.trim(),
          password: formPassword,
          sslMode: formSslMode,
          readOnly: formReadOnly,
        };
        await updateProfile(updated);
      }
    }
  };

  const handleTest = async () => {
    const tempProfile: ConnectionProfile = {
      id: selectedId || 'temp',
      name: formName,
      driver: formDriver,
      host: formHost,
      port: Number(formPort),
      database: formDatabase,
      username: formUsername,
      password: formPassword,
      sslMode: formSslMode,
      readOnly: formReadOnly,
      createdAt: '',
      updatedAt: '',
    };
    await testProfile(tempProfile);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteProfile(deleteConfirmId);
    setDeleteConfirmId(null);
    if (profiles.length > 1) {
      const next = profiles.find((p) => p.id !== deleteConfirmId);
      if (next) selectProfile(next);
    } else {
      handleStartNew();
    }
  };

  return (
    <>
      <Dialog open={connectionModalOpen} onOpenChange={setConnectionModalOpen}>
        <DialogContent className="max-w-4xl h-[620px] flex flex-col p-0 overflow-hidden bg-[#0a0d16] border-[#1b2333]">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#1b2333] flex items-center justify-between bg-[#0e1322] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-slate-100">
                  Database Connections
                </DialogTitle>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Configure connection profiles for live query execution (PostgreSQL, MySQL, SQLite, SQL Server)
                </div>
              </div>
            </div>

            <Button
              onClick={() => setConnectionModalOpen(false)}
              variant="ghost"
              size="iconSm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Body: Two columns */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Profiles List */}
            <div className="w-64 border-r border-[#1b2333] bg-[#0c101a] flex flex-col shrink-0">
              <div className="p-3 border-b border-[#1b2333]/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Profiles ({profiles.length})
                </span>
                <Button
                  onClick={handleStartNew}
                  variant="subtle"
                  size="sm"
                  className="h-6.5 text-[11px] px-2 gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {profiles.map((p) => {
                  const isCurrent = p.id === selectedId;
                  const isActiveTarget = p.id === activeProfileId;

                  return (
                    <div
                      key={p.id}
                      onClick={() => selectProfile(p)}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-[#151c2d]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-medium truncate">
                          <span>{p.name}</span>
                          {isActiveTarget && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Active Connection" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate uppercase">
                          {p.driver} · {p.database}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {profiles.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No connections yet. Click New to add one.
                  </div>
                )}
              </div>

              {selectedId && (
                <div className="p-3 border-t border-[#1b2333]/60 bg-[#0a0d17]">
                  <Button
                    onClick={() => setActiveProfileId(selectedId)}
                    disabled={selectedId === activeProfileId}
                    variant={selectedId === activeProfileId ? 'secondary' : 'default'}
                    size="sm"
                    className="w-full text-xs"
                  >
                    {selectedId === activeProfileId ? 'Active Profile' : 'Set as Active Connection'}
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Form Editor */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#080b11] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Profile Name</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Local PostgreSQL"
                    className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Database Type</label>
                  <select
                    value={formDriver}
                    onChange={(e) => handleDriverChange(e.target.value as SQLDialect)}
                    className="w-full h-8 px-2.5 rounded-md bg-[#111622] border border-[#1b2333] text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL / MariaDB</option>
                    <option value="sqlite">SQLite</option>
                    <option value="sqlserver">Microsoft SQL Server</option>
                  </select>
                </div>
              </div>

              {formDriver !== 'sqlite' ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Host / Server</label>
                      <Input
                        value={formHost}
                        onChange={(e) => setFormHost(e.target.value)}
                        placeholder="localhost or 127.0.0.1"
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Port</label>
                      <Input
                        type="number"
                        value={formPort}
                        onChange={(e) => setFormPort(Number(e.target.value))}
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Database Name</label>
                      <Input
                        value={formDatabase}
                        onChange={(e) => setFormDatabase(e.target.value)}
                        placeholder="postgres"
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">SSL Mode</label>
                      <select
                        value={formSslMode}
                        onChange={(e) => setFormSslMode(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md bg-[#111622] border border-[#1b2333] text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="disable">Disable</option>
                        <option value="require">Require</option>
                        <option value="prefer">Prefer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Username</label>
                      <Input
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="postgres"
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Password</label>
                      <Input
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Database File Path</label>
                  <Input
                    value={formDatabase}
                    onChange={(e) => setFormDatabase(e.target.value)}
                    placeholder="e.g. C:\data\database.db"
                    className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Path to local SQLite .db or .sqlite file. If file does not exist, it will be created.
                  </div>
                </div>
              )}

              {/* Safe Mode Toggle */}
              <div className="p-3 bg-[#0d1322] border border-[#1b2333] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {formReadOnly ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Safe / Read-Only Mode
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formReadOnly
                        ? 'Blocks destructive queries (DROP, TRUNCATE, DELETE/UPDATE without WHERE)'
                        : 'Caution: unrestricted query execution mode enabled'}
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={formReadOnly}
                  onChange={(e) => setFormReadOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1b2333]">
                <Button
                  onClick={handleTest}
                  disabled={isTesting}
                  variant="secondary"
                  size="sm"
                  className="text-xs gap-1.5"
                >
                  <Radio className={`w-3.5 h-3.5 ${isTesting ? 'animate-ping' : ''}`} />
                  <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
                </Button>

                <Button
                  onClick={handleSave}
                  variant="default"
                  size="sm"
                  className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isCreatingNew ? 'Create Connection' : 'Save Changes'}</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* shadcn AlertDialog for deleting profile */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this connection profile? Saved queries will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
