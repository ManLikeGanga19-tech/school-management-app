import React from 'react';
import { BookOpen, Users, DollarSign, Bell, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: 'dashboard' | 'students' | 'payments' | 'sms') => void;
    isOpen: boolean;
    onToggle: () => void;
    onLogout: () => void;
}

export function Sidebar({ currentView, onViewChange, isOpen, onToggle, onLogout }: SidebarProps) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'payments', label: 'Fee Payments', icon: DollarSign },
        { id: 'sms', label: 'SMS Notifications', icon: Bell },
    ];

    return (
        <div className={`bg-blue-900 text-white transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
            <div>
                <div className="p-4 flex items-center justify-between">
                    <h1 className={`font-bold text-xl ${!isOpen && 'hidden'}`}>School Admin</h1>
                    <Button
                        onClick={onToggle}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-800 text-white"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                </div>

                <nav className="mt-8">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id as any)}
                                className={`w-full flex items-center px-4 py-3 hover:bg-blue-800 transition-colors ${currentView === item.id && 'bg-blue-800'
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