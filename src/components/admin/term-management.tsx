'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SystemSettings } from '@/types';
import { systemSettingsService } from '@/lib/appwrite/system-settings.service';
import { studentService } from '@/lib/appwrite/student.service';
import { authService } from '@/lib/appwrite/auth.service';
import { toast } from 'sonner';

export function TermManagement() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRollingOver, setIsRollingOver] = useState(false);
    const [showRolloverDialog, setShowRolloverDialog] = useState(false);

    const [formData, setFormData] = useState({
        academicYear: new Date().getFullYear().toString(),
        currentTerm: 1 as 1 | 2 | 3,
        term1StartDate: '',
        term1EndDate: '',
        term2StartDate: '',
        term2EndDate: '',
        term3StartDate: '',
        term3EndDate: '',
    });

    const COLLECTION_ID =
        process.env.NEXT_PUBLIC_APPWRITE_SYSTEM_SETTINGS_COLLECTION_ID ||
        'system_settings';

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                toast.error('Authentication Error', {
                    description: 'You must be logged in to access settings',
                });
                return;
            }

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) {
                toast.error('Configuration Error', {
                    description: 'School name not found in your profile',
                });
                return;
            }

            const currentSettings = await systemSettingsService.getSettings(
                profile.schoolName,
                COLLECTION_ID
            );

            if (currentSettings) {
                setSettings(currentSettings);
                setFormData({
                    academicYear: currentSettings.academicYear,
                    currentTerm: currentSettings.currentTerm,
                    term1StartDate: currentSettings.term1StartDate,
                    term1EndDate: currentSettings.term1EndDate,
                    term2StartDate: currentSettings.term2StartDate,
                    term2EndDate: currentSettings.term2EndDate,
                    term3StartDate: currentSettings.term3StartDate,
                    term3EndDate: currentSettings.term3EndDate,
                });
            } else {
                setFormData({
                    academicYear: new Date().getFullYear().toString(),
                    currentTerm: 1,
                    term1StartDate: `${new Date().getFullYear()}-01-15`,
                    term1EndDate: `${new Date().getFullYear()}-04-30`,
                    term2StartDate: `${new Date().getFullYear()}-05-01`,
                    term2EndDate: `${new Date().getFullYear()}-08-31`,
                    term3StartDate: `${new Date().getFullYear()}-09-01`,
                    term3EndDate: `${new Date().getFullYear()}-12-15`,
                });
            }
        } catch (error: any) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to Load Settings', {
                description: error.message || 'Could not load term settings',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const user = await authService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) throw new Error('School name not found');

            const settingsData = {
                ...formData,
                schoolName: profile.schoolName,
                lastUpdatedBy: user.$id,
            };

            if (settings) {
                await systemSettingsService.updateSettings(
                    settings.$id!,
                    settingsData,
                    COLLECTION_ID
                );
                toast.success('Settings Updated! ✅', {
                    description: 'Term settings have been saved successfully',
                });
            } else {
                await systemSettingsService.createSettings(settingsData, COLLECTION_ID);
                toast.success('Settings Created! ✅', {
                    description: 'Term settings have been initialized',
                });
            }

            await loadSettings();
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            toast.error('Save Failed', {
                description: error.message || 'Could not save settings',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRolloverToNextTerm = async () => {
        setIsRollingOver(true);
        try {
            const user = await authService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) throw new Error('School name not found');

            const currentTerm = formData.currentTerm;
            const nextTerm = currentTerm === 3 ? 1 : ((currentTerm + 1) as 1 | 2 | 3);

            toast.loading('Rolling over to next term...', {
                description: 'This may take a moment. Please wait.',
            });

            const result = await studentService.rolloverAllStudentsToNextTerm(
                profile.schoolName,
                currentTerm
            );

            const newAcademicYear =
                currentTerm === 3
                    ? (parseInt(formData.academicYear) + 1).toString()
                    : formData.academicYear;

            await systemSettingsService.updateSettings(
                settings?.$id!,
                {
                    currentTerm: nextTerm,
                    academicYear: newAcademicYear,
                    schoolName: profile.schoolName,
                    lastUpdatedBy: user.$id,
                },
                COLLECTION_ID
            );

            toast.dismiss();
            toast.success('Term Rollover Complete! 🎉', {
                description: (
                    <div className="mt-2">
                        <p className="font-semibold">
                            Successfully moved to Term {nextTerm}
                        </p>
                        <p className="text-xs mt-1">{result.successful} students updated</p>
                        {result.failed > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                                {result.failed} students failed to update
                            </p>
                        )}
                    </div>
                ),
                duration: 6000,
            });

            setShowRolloverDialog(false);
            await loadSettings();
        } catch (error: any) {
            console.error('Rollover failed:', error);
            toast.dismiss();
            toast.error('Rollover Failed', {
                description: error.message || 'Could not complete term rollover',
            });
        } finally {
            setIsRollingOver(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="mx-auto max-w-full sm:max-w-xl">
                <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading term settings...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 px-3 sm:px-0">
            {/* Current Status Card */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg w-fit mx-auto sm:mx-0">
                            <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-center sm:text-left">Current Term Status</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Academic Year</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formData.academicYear}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Current Term</p>
                            <div className="flex justify-center sm:justify-start items-center gap-2">
                                <p className="text-2xl font-bold text-blue-600">
                                    Term {formData.currentTerm}
                                </p>
                                <Badge className="bg-green-500">Active</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Term Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Term Dates Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Academic Year *</Label>
                            <Input
                                type="number"
                                value={formData.academicYear}
                                onChange={(e) =>
                                    setFormData({ ...formData, academicYear: e.target.value })
                                }
                                placeholder="2025"
                                min="2020"
                                max="2100"
                            />
                        </div>
                        <div>
                            <Label>Current Term *</Label>
                            <select
                                value={formData.currentTerm}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        currentTerm: parseInt(e.target.value) as 1 | 2 | 3,
                                    })
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="1">Term 1</option>
                                <option value="2">Term 2</option>
                                <option value="3">Term 3</option>
                            </select>
                        </div>
                    </div>

                    <Separator />

                    {/* Each term grid now responsive */}
                    {[1, 2, 3].map((term) => (
                        <div className="space-y-3" key={term}>
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                <Badge
                                    variant={formData.currentTerm === term ? 'default' : 'outline'}
                                    className="text-xs"
                                >
                                    Term {term}
                                </Badge>
                                {formData.currentTerm === term && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={formData[`term${term}StartDate` as keyof typeof formData] as string}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                [`term${term}StartDate`]: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm">End Date</Label>
                                    <Input
                                        type="date"
                                        value={formData[`term${term}EndDate` as keyof typeof formData] as string}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                [`term${term}EndDate`]: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <Separator />
                        </div>
                    ))}

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <Button
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Term Rollover Card */}
            <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row items-center gap-2 text-orange-900">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Term Rollover</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-gray-700 mb-3 text-center sm:text-left">
                            <strong>What happens during rollover:</strong>
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>
                                All unpaid balances from Term {formData.currentTerm} will become arrears
                            </li>
                            <li>
                                System will move to Term{' '}
                                {formData.currentTerm === 3 ? 1 : formData.currentTerm + 1}
                            </li>
                            {formData.currentTerm === 3 && (
                                <li className="text-orange-700 font-semibold">
                                    Academic year will advance to {parseInt(formData.academicYear) + 1}
                                </li>
                            )}
                            <li>All students will be updated automatically</li>
                        </ul>
                    </div>

                    <Button
                        onClick={() => setShowRolloverDialog(true)}
                        variant="destructive"
                        className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Move to Next Term
                    </Button>
                </CardContent>
            </Card>

            {/* Rollover Confirmation Dialog */}
            <Dialog open={showRolloverDialog} onOpenChange={setShowRolloverDialog}>
                <DialogContent className="max-w-[95%] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Confirm Term Rollover
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-3 text-sm sm:text-base">
                            <p>
                                You are about to move from{' '}
                                <strong>Term {formData.currentTerm}</strong> to{' '}
                                <strong>
                                    Term {formData.currentTerm === 3 ? 1 : formData.currentTerm + 1}
                                </strong>
                                .
                            </p>
                            {formData.currentTerm === 3 && (
                                <p className="text-orange-700 font-semibold">
                                    This will also advance the academic year to{' '}
                                    {parseInt(formData.academicYear) + 1}.
                                </p>
                            )}
                            <p className="text-red-600 font-semibold">
                                ⚠️ All unpaid balances will become arrears. This action cannot be
                                undone easily.
                            </p>
                            <p>Are you sure you want to continue?</p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowRolloverDialog(false)}
                            disabled={isRollingOver}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRolloverToNextTerm}
                            disabled={isRollingOver}
                            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                        >
                            {isRollingOver ? 'Rolling Over...' : 'Confirm Rollover'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
