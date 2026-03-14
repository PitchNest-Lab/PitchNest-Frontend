import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button 
          className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors outline-none cursor-pointer"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'light' && (
              <motion.div
                key="sun"
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun size={20} />
              </motion.div>
            )}
            {theme === 'dark' && (
              <motion.div
                key="moon"
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon size={20} />
              </motion.div>
            )}
            {theme === 'system' && (
              <motion.div
                key="system"
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Monitor size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[140px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 shadow-xl z-50 animate-in fade-in zoom-in duration-200"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg outline-none cursor-pointer transition-colors",
              theme === 'light' ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
            )}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} />
            Light
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg outline-none cursor-pointer transition-colors",
              theme === 'dark' ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
            )}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} />
            Dark
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg outline-none cursor-pointer transition-colors",
              theme === 'system' ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
            )}
            onClick={() => setTheme('system')}
          >
            <Monitor size={16} />
            System
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
