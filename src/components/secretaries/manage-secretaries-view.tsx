"use client";

import React, { useEffect, useState } from "react";
import { authService } from "@/lib/appwrite/auth.service";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Trash2,
    AlertCircle,
    Edit,
    RefreshCcw,
    UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export function ManageSecretariesView({ adminId }: { adminId: string }) {
    const [secretaries, setSecretaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [editData, setEditData] = useState<any | null>(null);

    // 🔹 Load Secretaries
    const load = async () => {
        setError("");
        setLoading(true);
        try {
            const list = await authService.getSchoolSecretaries(adminId);
            setSecretaries(list);
        } catch (e: any) {
            setError(e.message);
            toast.error("Failed to load secretaries", {
                description: e.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [adminId]);

    // 🔹 Create Secretary
    const handleCreate = async () => {
        try {
            if (!form.name || !form.email || !form.password) {
                toast.error("Please fill in all required fields.");
                return;
            }

            await authService.createSecretary(adminId, form);
            toast.success("Secretary created successfully", {
                description: `${form.name} has been added (active and ready to log in).`,
            });

            setForm({ name: "", email: "", password: "" });
            setOpen(false);
            await load();
        } catch (e: any) {
            toast.error("Failed to create secretary", {
                description: e.message,
            });
        }
    };

    // 🔹 Deactivate Secretary (mark inactive)
    const handleDeactivate = async (secretaryId: string) => {
        try {
            await authService.updateSecretary(adminId, secretaryId, { isActive: false });
            toast.success("Secretary deactivated", {
                description: "Account marked as inactive. Secretary will be informed on login.",
            });
            await load();
        } catch (e: any) {
            toast.error("Failed to deactivate secretary", {
                description: e.message,
            });
        }
    };

    // 🔹 Reactivate Secretary (no duplicate user creation)
    const handleActivate = async (sec: any) => {
        try {
            toast.info("Reactivating account...", {
                description: `Updating ${sec.email} status.`,
            });

            await authService.updateSecretary(adminId, sec.$id, { isActive: true });

            toast.success(`Secretary ${sec.name} reactivated!`, {
                description: "They can now log in again.",
            });

            await load();
        } catch (e: any) {
            toast.error("Activation failed", {
                description: e.message,
            });
        }
    };

    // 🔹 Edit Secretary
    const handleEditClick = (sec: any) => {
        setEditData(sec);
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editData?.$id) return;
        try {
            const updates: any = {};
            if (editData.name) updates.name = editData.name;
            if (editData.email) updates.email = editData.email;
            updates.isActive = editData.isActive;

            await authService.updateSecretary(adminId, editData.$id, updates);

            toast.success("Secretary updated successfully", {
                description: `${editData.name}'s information has been updated.`,
            });

            setEditOpen(false);
            await load();
        } catch (e: any) {
            toast.error("Failed to update secretary", {
                description: e.message,
            });
        }
    };

    return (
        <div className="p-2 sm:p-4">
            <Card className="w-full max-w-full overflow-x-auto shadow-md">
                <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
                        Manage Secretaries
                    </CardTitle>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-700 hover:bg-blue-800 w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Add Secretary
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-[95%] rounded-lg">
                            <DialogHeader>
                                <DialogTitle>Create Secretary Account</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Temporary Password</Label>
                                    <Input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                                <Button onClick={handleCreate} className="w-full sm:w-auto">
                                    Create
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <p className="text-center py-4 text-gray-500">Loading secretaries...</p>
                    ) : (
                        <div className="min-w-[700px] sm:min-w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {secretaries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-gray-500">
                                                No secretaries found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        secretaries.map((sec) => (
                                            <TableRow key={sec.$id} className="text-sm sm:text-base">
                                                <TableCell>{sec.name}</TableCell>
                                                <TableCell className="truncate max-w-[180px] sm:max-w-none">
                                                    {sec.email}
                                                </TableCell>
                                                <TableCell>
                                                    {sec.isActive ? (
                                                        <span className="text-green-600 font-medium">Active</span>
                                                    ) : (
                                                        <span className="text-gray-500">Inactive</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        {!sec.isActive && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => handleActivate(sec)}
                                                            >
                                                                <UserCheck className="h-4 w-4 mr-1" /> Activate
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditClick(sec)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDeactivate(sec.$id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" /> Deactivate
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Secretary Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md w-[95%] rounded-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Secretary Info</DialogTitle>
                    </DialogHeader>
                    {editData && (
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input
                                    value={editData.name || ""}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={editData.email || ""}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!editData.isActive}
                                    onChange={(e) =>
                                        setEditData({ ...editData, isActive: e.target.checked })
                                    }
                                />
                                <Label className="cursor-pointer text-sm sm:text-base">
                                    Active (check to re-activate)
                                </Label>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditOpen(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdate}
                                    className="bg-blue-700 hover:bg-blue-800 w-full sm:w-auto"
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Update Info
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
