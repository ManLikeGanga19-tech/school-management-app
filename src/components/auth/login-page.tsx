'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Lock, Mail, AlertCircle, UserCog } from 'lucide-react';
import { authService, UserRole } from '@/lib/appwrite/auth.service';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('admin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0); // 🔹 countdown in seconds

    // Countdown effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (cooldown > 0) {
            setError(`Please wait ${cooldown} seconds before retrying.`);
            return;
        }

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        if (!role) {
            setError('Please select your role');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Starting login...', { email, role });

            // Attempt login
            await authService.login({ email, password });
            console.log('Login successful, verifying user role...');

            // Get current user
            const user = await authService.getCurrentUser();
            if (!user) throw new Error('Failed to retrieve user information');

            // Get user profile
            const userProfile = await authService.getUserProfile(user.$id);
            console.log('User profile:', userProfile);

            // Check if user role matches selection
            if (userProfile.role !== role) {
                await authService.logout();
                throw new Error(
                    `Access Denied: You are attempting to login as ${role} but your account role is ${userProfile.role}. Please select the correct role.`
                );
            }

            // Store session info
            if (typeof window !== 'undefined') {
                localStorage.setItem('userRole', userProfile.role);
                localStorage.setItem('userId', user.$id);
            }

            // Redirect to dashboard
            window.location.href = '/';
        } catch (err: any) {
            console.error('Login error:', err);

            // 🔹 Handle rate limit
            if (
                err.message?.includes('Too many login attempts') ||
                err.message?.includes('Rate limit')
            ) {
                setCooldown(60); // default 60 seconds
                setError('Too many login attempts. Please wait 60 seconds before trying again.');
            } else {
                setError(err.message || 'Login failed. Please check your credentials and try again.');
            }
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
                    <p className="text-blue-200">Staff Portal</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in to access your school management dashboard
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
                                <Label htmlFor="role">Login As *</Label>
                                <div className="relative">
                                    <UserCog className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                    <Select
                                        value={role}
                                        onValueChange={(value) => setRole(value as UserRole)}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="pl-10">
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="secretary">Secretary</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Select the role that matches your account
                                </p>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your.email@school.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
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

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full bg-blue-900 hover:bg-blue-800"
                                disabled={isLoading || cooldown > 0}
                            >
                                {isLoading
                                    ? 'Signing in...'
                                    : cooldown > 0
                                        ? `Wait ${cooldown}s`
                                        : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p className="mb-2">
                                <strong>Administrators:</strong> Register your school to get started
                            </p>
                            <p>
                                <strong>Secretaries:</strong> Contact your administrator for login credentials
                            </p>
                        </div>

                        {/* Register Link - Only for Admins */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                Need to register a new school?{' '}
                                <Link
                                    href="/register"
                                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                >
                                    Register as Administrator
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
