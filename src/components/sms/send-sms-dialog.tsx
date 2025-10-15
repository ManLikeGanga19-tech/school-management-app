'use client';

import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface SendSMSDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    totalWithBalance: number;
    messageType: 'fee' | 'general';
    onSend: (message: string) => void;
}

export function SendSMSDialog({
    open,
    onOpenChange,
    selectedCount,
    totalWithBalance,
    messageType,
    onSend
}: SendSMSDialogProps) {
    const [message, setMessage] = useState('');

    // Reset message when dialog opens or type changes
    useEffect(() => {
        if (open) {
            setMessage('');
        }
    }, [open, messageType]);

    const handleSend = () => {
        if (message.trim().length === 0) {
            return;
        }
        onSend(message);
        setMessage('');
    };

    // Fee reminder templates
    const feeTemplates = [
        {
            title: '💰 Fee Balance Reminder',
            message: 'Dear parent of [StudentName], this is a reminder that [StudentName] has an outstanding fee balance of KES [Balance]. Please clear the balance at your earliest convenience. Thank you.'
        },
        {
            title: '⚠️ Urgent Payment Notice',
            message: 'Dear parent of [StudentName] ([Class]), kindly settle the outstanding fee balance of KES [Balance] immediately. Contact the school office for payment arrangements. Thank you.'
        },
        {
            title: '📅 Payment Deadline Notice',
            message: 'Dear parent, [StudentName] in [Class] has a fee balance of KES [Balance]. Payment deadline is approaching. Please clear dues by end of week to avoid service interruption.'
        },
        {
            title: '💵 Partial Payment Request',
            message: 'Dear parent of [StudentName], your child has a fee balance of KES [Balance]. If full payment is challenging, please visit the office to arrange a payment plan. We are here to help.'
        },
        {
            title: '📊 Fee Statement Notice',
            message: 'Dear parent, [StudentName] ([Class]) currently has an outstanding balance of KES [Balance]. For a detailed fee statement, please contact the school office or visit us.'
        },
        {
            title: '🎓 Term Fee Reminder',
            message: 'Dear parent of [StudentName] in [Class], term fees are due. Current balance: KES [Balance]. Please ensure timely payment for uninterrupted learning. Thank you for your cooperation.'
        },
    ];

    // General announcement templates
    const generalTemplates = [
        {
            title: '📚 Term Opening Date',
            message: 'Dear parent of [StudentName] ([Class]), this is to inform you that school reopens on [Date]. Students should report by 8:00 AM. Kindly ensure [StudentName] has all required materials. Thank you.'
        },
        {
            title: '🏖️ Term Closing Notice',
            message: 'Dear parent, [StudentName] ([Class]) will close for the term on [Date] at 12:00 PM. Please arrange for timely pick-up. We wish you a wonderful holiday season!'
        },
        {
            title: '🎭 School Event Reminder',
            message: 'Dear parent of [StudentName], we have an upcoming [EventName] on [Date] at [Time]. All students in [Class] are required to attend. For more details, contact the school office.'
        },
        {
            title: '🎵 Music Festival Notice',
            message: 'Dear parent, our annual Music Festival will be held on [Date] at [Time]. [StudentName] ([Class]) is invited to participate. Attendance fee: KES [Amount]. Please confirm participation by [DeadlineDate].'
        },
        {
            title: '⚽ Sports Day Announcement',
            message: 'Dear parent of [StudentName], our Sports Day is scheduled for [Date] starting at [Time]. All students must wear their PE uniform. Parents are welcome to attend and cheer for [Class]!'
        },
        {
            title: '📝 Exam Fee Payment',
            message: 'Dear parent, [StudentName] ([Class]) is required to pay exam fees of KES [Amount] by [DeadlineDate]. This covers examination materials and processing. Please clear payment before the deadline.'
        },
        {
            title: '📖 Academic Progress Report',
            message: 'Dear parent of [StudentName], academic reports for [Class] are ready for collection. Please visit the school office from [Date] to pick up [StudentName]\'s report card. Thank you.'
        },
        {
            title: '🏥 Medical Check-up Notice',
            message: 'Dear parent, mandatory medical check-ups for [Class] will be conducted on [Date]. [StudentName] must attend. Fee: KES [Amount]. Please ensure payment before the scheduled date.'
        },
        {
            title: '👔 Uniform Reminder',
            message: 'Dear parent of [StudentName], this is a reminder to ensure [StudentName] is in proper school uniform daily. [Class] students must wear [UniformDetails]. Thank you for your cooperation.'
        },
        {
            title: '🎓 Parents Meeting',
            message: 'Dear parent, we have a parents meeting scheduled for [Date] at [Time]. We will discuss [StudentName]\'s progress in [Class] and other important matters. Your attendance is highly appreciated.'
        },
        {
            title: '📢 General Announcement',
            message: 'Dear parent of [StudentName] ([Class]), this is to inform you that [AnnouncementDetails]. For more information, please contact the school office. Thank you.'
        },
        {
            title: '🚨 Emergency Notice',
            message: 'Dear parent of [StudentName], due to unforeseen circumstances, [Class] will [ActionDetails] on [Date]. Please take note and plan accordingly. We apologize for any inconvenience.'
        },
    ];

    const templates = messageType === 'fee' ? feeTemplates : generalTemplates;

    const useTemplate = (templateMessage: string) => {
        setMessage(templateMessage);
    };

    const recipients = selectedCount > 0 ? selectedCount : totalWithBalance;
    const characterCount = message.length;

    const dialogColor = messageType === 'fee' ? 'orange' : 'blue';
    const dialogBg = messageType === 'fee' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
    const dialogText = messageType === 'fee' ? 'text-orange-900' : 'text-blue-900';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {messageType === 'fee' ? '💰 Send Fee Reminder' : '📢 Send Announcement'} 📱
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Recipient Info Alert */}
                    <Alert className={dialogBg}>
                        <AlertDescription className={dialogText}>
                            {selectedCount > 0
                                ? `📤 Sending to ${selectedCount} selected guardian(s)`
                                : messageType === 'fee'
                                    ? `📤 Sending to all ${totalWithBalance} guardians with outstanding fees`
                                    : `📤 Sending to all ${totalWithBalance} guardians`}
                        </AlertDescription>
                    </Alert>

                    {/* SMS Templates Section */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                            {messageType === 'fee' ? 'Fee Reminder Templates' : 'Announcement Templates'}
                        </Label>
                        <p className="text-xs text-gray-500">Click a template to use it (variables will be auto-filled)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                            {templates.map((template, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => useTemplate(template.message)}
                                    className="h-auto py-3 px-3 text-left justify-start whitespace-normal"
                                >
                                    <div>
                                        <p className="font-semibold text-xs">{template.title}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                                            {template.message.substring(0, 60)}...
                                        </p>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Message Content *</Label>
                        <Textarea
                            id="message"
                            placeholder={messageType === 'fee'
                                ? "Type fee reminder... Use: [StudentName], [Class], [Balance]"
                                : "Type announcement... Use: [StudentName], [Class], [Date], [Time], [Amount], etc."}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                        <div className="flex justify-between items-start text-xs text-gray-500">
                            <span>{characterCount} characters</span>
                            <span className="text-right">
                                Africa&apos;s Talking handles long SMS automatically
                            </span>
                        </div>
                    </div>

                    {/* Available Variables Info */}
                    <Card className={dialogBg}>
                        <CardContent className="p-4">
                            <p className={`text-xs font-semibold ${dialogText} mb-2`}>📝 Available Variables:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                <div className="bg-white p-2 rounded border">
                                    <code className="font-mono font-semibold">[StudentName]</code>
                                    <p className="text-[10px] mt-1 text-gray-600">Student&apos;s name</p>
                                </div>
                                <div className="bg-white p-2 rounded border">
                                    <code className="font-mono font-semibold">[Class]</code>
                                    <p className="text-[10px] mt-1 text-gray-600">Grade/class</p>
                                </div>
                                {messageType === 'fee' && (
                                    <div className="bg-white p-2 rounded border">
                                        <code className="font-mono font-semibold">[Balance]</code>
                                        <p className="text-[10px] mt-1 text-gray-600">Fee balance</p>
                                    </div>
                                )}
                                {messageType === 'general' && (
                                    <>
                                        <div className="bg-white p-2 rounded border">
                                            <code className="font-mono font-semibold">[Date]</code>
                                            <p className="text-[10px] mt-1 text-gray-600">Event date</p>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <code className="font-mono font-semibold">[Time]</code>
                                            <p className="text-[10px] mt-1 text-gray-600">Event time</p>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <code className="font-mono font-semibold">[Amount]</code>
                                            <p className="text-[10px] mt-1 text-gray-600">Fee/cost</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <p className={`text-[10px] ${dialogText} mt-2`}>
                                💡 Replace placeholders like [Date], [Time], [Amount] with actual values before sending
                            </p>
                        </CardContent>
                    </Card>

                    {/* Message Preview */}
                    {message && (
                        <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-2">
                                    <div className="text-2xl">📱</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Message Preview:</p>
                                        <div className="bg-white p-3 rounded-lg border shadow-sm">
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{message}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            Variables will be replaced with actual data for each student
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tips */}
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-green-900 mb-2">💡 SMS Best Practices:</p>
                            <ul className="text-xs text-green-800 space-y-1 list-disc list-inside">
                                <li>Be clear, professional, and courteous</li>
                                <li>Include your school name for identification</li>
                                <li>Use variables for personalized messages</li>
                                {messageType === 'general' && (
                                    <li className="text-blue-700">Replace bracketed placeholders with actual values</li>
                                )}
                                <li>Messages sent via Africa&apos;s Talking SMS Gateway</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        className={`w-full sm:w-auto ${messageType === 'fee'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        disabled={message.trim().length === 0}
                    >
                        <Send size={16} className="mr-2" />
                        Send to {recipients} Guardian{recipients !== 1 ? 's' : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}