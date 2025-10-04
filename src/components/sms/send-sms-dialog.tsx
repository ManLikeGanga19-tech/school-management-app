import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SendSMSDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    totalWithBalance: number;
    onSend: (message: string) => void;
}

export function SendSMSDialog({ open, onOpenChange, selectedCount, totalWithBalance, onSend }: SendSMSDialogProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        onSend(message);
        setMessage('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send SMS Notification</DialogTitle>
                </DialogHeader>

                <Alert>
                    <AlertDescription>
                        {selectedCount > 0
                            ? `Sending to ${selectedCount} selected guardian(s)`
                            : `Sending to all ${totalWithBalance} guardians with outstanding fees`}
                    </AlertDescription>
                </Alert>

                <Textarea
                    placeholder="Enter message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                />

                <p className="text-sm text-gray-500">
                    Tip: Use variables like [StudentName] and [Balance] in your message
                </p>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700">
                        <Send size={16} className="mr-2" />
                        Send SMS
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}