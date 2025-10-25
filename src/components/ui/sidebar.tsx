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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: 'dashboard' | 'students' | 'payments' | 'sms' | 'secretaries') => void;
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
        // ✅ Admin menu
        menuItems = [
            { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'payments', label: 'Fee Payments', icon: DollarSign },
            { id: 'sms', label: 'SMS Notifications', icon: Bell },
            { id: 'secretaries', label: 'Manage Secretaries', icon: UserCog },
        ];
    } else if (userRole === 'secretary') {
        // ✅ Secretary menu
        menuItems = [
            { id: 'students', label: 'Students', icon: Users },
            { id: 'payments', label: 'Fee Payments', icon: DollarSign },
            { id: 'sms', label: 'SMS Notifications', icon: Bell },
        ];
    } else {
        // fallback (if role undefined)
        menuItems = [{ id: 'dashboard', label: 'Dashboard', icon: BookOpen }];
    }

    // 🔒 Prevent restricted access (e.g., secretary clicking Dashboard manually)
    const handleViewChange = (view: string) => {
        if (userRole === 'secretary' && view === 'dashboard') {
            toast.warning('Access Restricted', {
                description: 'Secretaries cannot access the dashboard.',
            });
            return;
        }

        if (userRole === 'secretary' && view === 'secretaries') {
            toast.warning('Access Restricted', {
                description: 'Only administrators can manage users.',
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
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleViewChange(item.id)}
                                className={`w-full flex items-center px-4 py-3 hover:bg-blue-800 transition-colors ${currentView === item.id ? 'bg-blue-800' : ''
                                    }`}
                            >
                                <Icon size={20} />
                                {isOpen && <span className="ml-3">{item.label}</span>}
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
