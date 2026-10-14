import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Database, ShieldCheck, LogOut, MessageSquare, Calendar } from 'lucide-react';
import { extractFirstName } from '../lib/utils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name?: string; email: string; uid?: string } | null;
  sessionsCount?: number;
  onLogOut: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sessionsCount = 0,
  onLogOut,
}) => {
  if (!isOpen || !currentUser) return null;

  const displayName = extractFirstName(currentUser.name, currentUser.email) || currentUser.name || 'Account User';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#161618] border border-white/10 rounded-2xl shadow-2xl text-white overflow-hidden"
        >
          {/* Header Banner */}
          <div className="relative h-28 bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-teal-900/60 p-6 flex items-start justify-between border-b border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full text-[11px] font-semibold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Synced
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/70 hover:text-white transition-all backdrop-blur-sm"
              title="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Avatar Badge */}
          <div className="px-6 -mt-10 flex items-end justify-between mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-2xl font-bold text-white shadow-xl border-4 border-[#161618]">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-[#161618]">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="text-right pb-1">
              <div className="text-xs text-white/50 font-mono">ACCOUNT STATUS</div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center justify-end gap-1">
                <Database className="w-3 h-3" />
                <span>Active & Persistent</span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 space-y-4 pb-6">
            <div>
              <h2 className="text-xl font-bold text-white truncate">
                {displayName}
              </h2>
              <p className="text-xs text-white/60 truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-white/40" />
                <span>{currentUser.email}</span>
              </p>
            </div>

            {/* Information Grid */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-white/50 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-white/40" />
                  User ID (UID)
                </span>
                <span className="font-mono text-[11px] text-white/90 bg-black/40 px-2 py-0.5 rounded border border-white/5 truncate max-w-[180px]">
                  {currentUser.uid || 'Firebase Account'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-white/50 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-white/40" />
                  Saved Conversations
                </span>
                <span className="font-semibold text-emerald-400">
                  {sessionsCount} {sessionsCount === 1 ? 'chat' : 'chats'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-white/50 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  Cross-Browser Sync
                </span>
                <span className="text-emerald-400 font-medium">Enabled</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={onLogOut}
                className="flex-1 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
