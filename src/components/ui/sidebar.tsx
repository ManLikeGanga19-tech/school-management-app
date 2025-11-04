'use client';

import React from 'react';
import {
    BookOpen,
    Users,
    DollarSign,
    Bell,
    Menu,
    X,
    LogOut,
    UserCog,
    Calendar,
    Coins, // 🆕 Icon for Arrears Management
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarProps {
    currentView: string;
    onViewChange: (
        view:
            | 'dashboard'
            | 'students'
            | 'payments'
            | 'sms'
            | 'secretaries'
            | 'term-management'
            | 'arrears-management'
    ) => void;
    isOpen: boolean;
    onToggle: () => void;
    onLogout: () => void;
    userRole?: string;
}

export function Sidebar({
    currentView,
    onViewChange,
    isOpen,
    onToggle,
    onLogout,
    userRole,
}: SidebarProps) {
    // 🧭 Define role-based menus
    let menuItems: { id: string; label: string; icon: any }[] = [];

    if (userRole === 'admin') {
        // ✅ Admin menu (now includes Arrears Management)
        menuItems = [
            { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'payments', label: 'Fee Payments', icon: DollarSign },
            { id: 'sms', label: 'SMS Notifications', icon: Bell },
            { id: 'secretaries', label: 'Manage Secretaries', icon: UserCog },
            { id: 'term-management', label: 'Term Management', icon: Calendar },
            { id: 'arrears-management', label: 'Arrears Management', icon: Coins }, // 🆕 Added
        ];
    } else if (userRole === 'secretary') {
        // ✅ Secretary menu (restricted: no Term or Arrears Management)
        menuItems = [
            { id: 'students', label: 'Students', icon: Users },
            { id: 'payments', label: 'Fee Payments', icon: DollarSign },
            { id: 'sms', label: 'SMS Notifications', icon: Bell },
        ];
    } else {
        // fallback (if role undefined)
        menuItems = [{ id: 'dashboard', label: 'Dashboard', icon: BookOpen }];
    }

    // 🔒 Prevent restricted access
    const handleViewChange = (view: string) => {
        if (userRole === 'secretary' && ['dashboard', 'secretaries', 'term-management', 'arrears-management'].includes(view)) {
            toast.warning('Access Restricted', {
                description: 'Only administrators can access this section.',
            });
            return;
        }

        onViewChange(view as any);
    };

    return (
        <div
            className={`bg-blue-900 text-white transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-20'
                }`}
        >
            {/* Header */}
            <div>
                <div className="p-4 flex items-center justify-between">
                    <h1 className={`font-bold text-xl ${!isOpen && 'hidden'}`}>
                        {userRole === 'secretary' ? 'Secretary Panel' : 'School Admin'}
                    </h1>
                    <Button
                        onClick={onToggle}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-800 text-white"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                </div>

                {/* Navigation Items */}
                <nav className="mt-8">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isSpecial =
                            item.id === 'term-management' || item.id === 'arrears-management';

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleViewChange(item.id)}
                                className={`w-full flex items-center px-4 py-3 hover:bg-blue-800 transition-colors ${currentView === item.id ? 'bg-blue-800' : ''
                                    } ${isSpecial ? 'border-t border-blue-800 mt-2' : ''}`}
                            >
                                <Icon
                                    size={20}
                                    className={
                                        isSpecial
                                            ? item.id === 'arrears-management'
                                                ? 'text-amber-400'
                                                : 'text-amber-300'
                                            : ''
                                    }
                                />
                                {isOpen && (
                                    <span
                                        className={`ml-3 ${isSpecial
                                                ? 'text-amber-300 font-semibold'
                                                : ''
                                            }`}
                                    >
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Logout Button at Bottom */}
            <div className="mt-auto border-t border-blue-800">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-4 hover:bg-blue-800 transition-colors text-red-300 hover:text-red-200"
                >
                    <LogOut size={20} />
                    {isOpen && <span className="ml-3">Logout</span>}
                </button>
            </div>
        </div>
    );
}
