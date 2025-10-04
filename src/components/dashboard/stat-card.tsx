import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    valueColor?: string;
}

export function StatsCard({ title, value, icon: Icon, iconColor, valueColor = 'text-gray-800' }: StatsCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">{title}</p>
                        <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
                    </div>
                    <Icon className={iconColor} size={40} />
                </div>
            </CardContent>
        </Card>
    );
}