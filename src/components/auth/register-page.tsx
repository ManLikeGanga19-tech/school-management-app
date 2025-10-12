import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Lock, Mail, AlertCircle, User, Building, Key } from 'lucide-react';

export function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        schoolName: '',
        role: 'admin',
        systemKey: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        // Validation
        if (!formData.email || !formData.password || !formData.name || !formData.schoolName || !formData.systemKey) {
            setError('Please fill in all required fields');
            setIsLoading(false);
            return;
        }

        if (!formData.email.includes('@')) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            // Call registration API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    schoolName: formData.schoolName,
                    role: formData.role,
                    systemKey: formData.systemKey,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            setSuccess('Account created successfully! Redirecting to login...');

            // Redirect to home page after successful registration
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                        <BookOpen className="text-blue-900" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">School Management System</h1>
                    <p className="text-blue-200">System Registration Portal</p>
                </div>

                {/* Registration Card */}
                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Create School Account</CardTitle>
                        <CardDescription>
                            Register your school with the management system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert className="bg-green-50 text-green-900 border-green-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* School Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="schoolName">School Name *</Label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="schoolName"
                                            type="text"
                                            placeholder="Springfield High School"
                                            value={formData.schoolName}
                                            onChange={(e) => handleInputChange('schoolName', e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@school.com"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => handleInputChange('role', value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                        <SelectItem value="director">Director</SelectItem>
                                        <SelectItem value="accountant">Accountant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Min. 8 characters"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Confirm password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* System Key */}
                            <div className="space-y-2">
                                <Label htmlFor="systemKey">System Registration Key *</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="systemKey"
                                        type="password"
                                        placeholder="Enter system registration key"
                                        value={formData.systemKey}
                                        onChange={(e) => handleInputChange('systemKey', e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Contact system administrator for registration key
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-900 hover:bg-blue-800"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>Already have an account?{' '}
                                <a href="/login" className="text-blue-600 hover:underline">
                                    Sign in here
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-blue-200 text-sm">
                    <p>&copy; 2025 School Management System. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}