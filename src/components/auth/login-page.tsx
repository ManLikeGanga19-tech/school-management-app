'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Lock, Mail, AlertCircle, UserCog } from 'lucide-react';
import { authService } from '@/lib/appwrite/auth.service';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!email || !password) {
            setError('Please enter both email and password');
            setIsLoading(false);
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        if (!role) {
            setError('Please select your role');
            setIsLoading(false);
            return;
        }

        try {
            console.log('Starting login...', { email, role });

            // Login directly with auth service
            await authService.login({ email, password });
            console.log('Login successful, checking user...');

            // Get current user
            const user = await authService.getCurrentUser();
            console.log('User retrieved:', user);

            if (user) {
                // Get user profile to check role
                const userProfile = await authService.getUserProfile(user.$id);
                console.log('User profile:', userProfile);

                // Verify role matches
                if (userProfile.role !== role) {
                    await authService.logout();
                    throw new Error(`You are not authorized to login as ${role}. Your role is ${userProfile.role}.`);
                }
            }

            console.log('Role verified, redirecting to home...');

            // Use window.location for a hard redirect (ensures new page load)
            window.location.href = '/';
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                        <BookOpen className="text-blue-900" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">School Management System</h1>
                    <p className="text-blue-200">Admin Portal</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in to your school admin account
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

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Login As</Label>
                                <div className="relative">
                                    <UserCog className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                    <Select
                                        value={role}
                                        onValueChange={setRole}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="pl-10">
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="director">Director</SelectItem>
                                            <SelectItem value="accountant">Accountant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@school.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-900 hover:bg-blue-800"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>Account created by system administrator</p>
                            <p className="mt-1">Contact support if you need assistance</p>
                        </div>

                        {/* Register Link */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                Need to register a new school?{' '}
                                <Link
                                    href="/register"
                                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                >
                                    Create an account
                                </Link>
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