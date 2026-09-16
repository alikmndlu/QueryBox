import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  ShieldCheck,
  Save,
  Radio,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const selectProfile = (p: ConnectionProfile) => {
    setSelectedId(p.id);
    setIsCreatingNew(false);
    setFormName(p.name);
    setFormDriver(p.driver);
    setFormHost(p.host || 'localhost');
    setFormPort(p.port || DEFAULT_PORTS[p.driver] || 5432);
    setFormDatabase(p.database);
    setFormUsername(p.username);
    setFormPassword(p.password || '');
    setFormSslMode(p.sslMode || 'disable');
    setFormReadOnly(p.readOnly ?? true);
    setTestStatus(null);
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
    setTestStatus(null);
  };

  // Synchronize form when modal opens or profiles load
  useEffect(() => {
    if (!connectionModalOpen) {
      setTestStatus(null);
      return;
    }

    if (profiles.length > 0) {
      const target = profiles.find((p) => p.id === (selectedId || activeProfileId)) || profiles[0];
      selectProfile(target);
    } else {
      handleStartNew();
    }
  }, [connectionModalOpen, profiles.length]);

  const handleDriverChange = (driver: SQLDialect) => {
    setFormDriver(driver);
    setFormPort(DEFAULT_PORTS[driver] || 5432);
    if (driver === 'sqlite' && (!formDatabase || formDatabase === 'postgres' || formDatabase === 'mysql')) {
      setFormDatabase('querybox_local.db');
    }
    setTestStatus(null);
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
      setTestStatus({ success: true, message: `Profile "${created.name}" created and saved successfully.` });
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
        setTestStatus({ success: true, message: `Changes to "${updated.name}" saved successfully.` });
      }
    }
  };

  const handleTest = async () => {
    setTestStatus(null);
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await testProfile(tempProfile);
    setTestStatus(result);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteProfile(deleteConfirmId);
    setDeleteConfirmId(null);
    setTestStatus(null);
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
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setTestStatus(null);
                    }}
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
                        onChange={(e) => {
                          setFormHost(e.target.value);
                          setTestStatus(null);
                        }}
                        placeholder="localhost or 127.0.0.1"
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Port</label>
                      <Input
                        type="number"
                        value={formPort}
                        onChange={(e) => {
                          setFormPort(Number(e.target.value));
                          setTestStatus(null);
                        }}
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Database Name</label>
                      <Input
                        value={formDatabase}
                        onChange={(e) => {
                          setFormDatabase(e.target.value);
                          setTestStatus(null);
                        }}
                        placeholder="postgres"
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">SSL Mode</label>
                      <select
                        value={formSslMode}
                        onChange={(e) => {
                          setFormSslMode(e.target.value);
                          setTestStatus(null);
                        }}
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
                        onChange={(e) => {
                          setFormUsername(e.target.value);
                          setTestStatus(null);
                        }}
                        placeholder="postgres"
                        className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Password</label>
                      <Input
                        type="password"
                        value={formPassword}
                        onChange={(e) => {
                          setFormPassword(e.target.value);
                          setTestStatus(null);
                        }}
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
                    onChange={(e) => {
                      setFormDatabase(e.target.value);
                      setTestStatus(null);
                    }}
                    placeholder="e.g. C:\data\database.db"
                    className="h-8 text-xs bg-[#111622] border-[#1b2333]"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Path to local SQLite .db or .sqlite file. If file does not exist, it will be created.
                  </div>
                </div>
              )}

              {/* Safe Mode Banner */}
              <div className="p-3 bg-[#0d1322] border border-emerald-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span>Strict Read-Only Mode</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      QueryBox exclusively runs data retrieval queries (SELECT, EXPLAIN, SHOW, DESCRIBE). All modifications (DELETE, UPDATE, INSERT, DROP) are permanently blocked.
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Test / Status Result Alert */}
              {isTesting && (
                <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 text-xs flex items-center gap-2.5 animate-pulse">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                  <span>Testing database connection to {formHost}:{formPort}...</span>
                </div>
              )}

              {!isTesting && testStatus && (
                <div
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 transition-all ${
                    testStatus.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>{testStatus.success ? 'Connection Successful!' : 'Connection Failed'}</span>
                    </div>
                    <div className="text-[11px] text-slate-200 break-words font-mono select-text bg-[#070a10]/80 p-2.5 rounded border border-white/10">
                      {testStatus.message}
                    </div>

                    {!testStatus.success && (
                      <div className="text-[11px] text-slate-300 font-sans space-y-1 pt-1.5 border-t border-rose-500/20">
                        <div className="font-medium text-rose-300">Suggestions:</div>
                        {testStatus.message.toLowerCase().includes('password authentication failed') && (
                          <div className="text-slate-400">
                            • Authentication error: The password or username was rejected by PostgreSQL. Check that <strong>Username</strong> ({formUsername}) and <strong>Password</strong> are correct.
                          </div>
                        )}
                        {(testStatus.message.toLowerCase().includes('connection refused') ||
                          testStatus.message.toLowerCase().includes('actively refused') ||
                          testStatus.message.toLowerCase().includes('connectex')) && (
                          <div className="text-slate-400">
                            • Server is unreachable on <strong>{formHost}:{formPort}</strong>. Ensure PostgreSQL service is running and listening on this port.
                            {formHost.toLowerCase() === 'localhost' && (
                              <div className="mt-1">
                                • Try switching Host to{' '}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormHost('127.0.0.1');
                                    setTestStatus(null);
                                  }}
                                  className="text-indigo-400 underline font-mono hover:text-indigo-300 cursor-pointer"
                                >
                                  127.0.0.1
                                </button>{' '}
                                if your server only listens on IPv4.
                              </div>
                            )}
                          </div>
                        )}
                        {testStatus.message.toLowerCase().includes('does not exist') && (
                          <div className="text-slate-400">
                            • Database <strong>&apos;{formDatabase}&apos;</strong> does not exist on the server. Verify your Database Name.
                          </div>
                        )}
                        {formDriver === 'postgresql' && formSslMode !== 'disable' && (
                          <div className="text-slate-400">
                            • For local database, setting <strong>SSL Mode</strong> to <code>Disable</code> is usually recommended.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setTestStatus(null)}
                    className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
