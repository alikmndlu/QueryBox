import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  action: () => void;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates if menu overflows viewport
  const styleX = Math.min(x, window.innerWidth - 200);
  const styleY = Math.min(y, window.innerHeight - (items.length * 32 + 20));

  return (
    <div
      ref={menuRef}
      style={{ left: `${styleX}px`, top: `${styleY}px` }}
      className="fixed z-50 min-w-[180px] py-1 bg-[#121826] border border-[#1e293b] rounded-lg shadow-2xl text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
            item.danger
              ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
              : 'hover:bg-[#182032] hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
