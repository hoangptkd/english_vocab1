// App.js - Updated version
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import TopicsScreen from './screens/TopicsScreen';
import LearnNewScreen from './screens/LearnNewScreen';
import ReviewScreen from './screens/ReviewScreen';
import StatsScreen from './screens/StatsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import PremiumScreen from './screens/PremiumScreen';
// Admin Screens
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminTopicsScreen from './screens/AdminTopicsScreen';
import AdminVocabularyScreen from './screens/AdminVocabularyScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: '#4F46E5' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                {!user ? (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ title: 'Đăng ký' }}
                        />
                        <Stack.Screen
                            name="ForgotPassword"
                            component={ForgotPasswordScreen}
                            options={{ title: 'Quên mật khẩu' }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{ title: 'Trang chủ' }}
                        />
                        <Stack.Screen
                            name="Topics"
                            component={TopicsScreen}
                            options={{ title: 'Chọn chủ đề' }}
                        />
                        <Stack.Screen
                            name="LearnNew"
                            component={LearnNewScreen}
                            options={{ title: 'Học từ mới' }}
                        />
                        <Stack.Screen
                            name="Review"
                            component={ReviewScreen}
                            options={{ title: 'Ôn tập' }}
                        />
                        <Stack.Screen
                            name="Stats"
                            component={StatsScreen}
                            options={{ title: 'Thống kê' }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Premium"
                            component={PremiumScreen}
                            options={{
                                title: 'Nâng cấp Premium',
                                headerStyle: {
                                    backgroundColor: '#F59E0B',
                                },
                                headerTintColor: '#fff',
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                        {/* Admin Screens - Only accessible if user is admin */}
                        {user?.role === 'admin' && (
                            <>
                                <Stack.Screen
                                    name="AdminDashboard"
                                    component={AdminDashboardScreen}
                                    options={{
                                        headerShown: false,
                                        title: 'Admin Dashboard'
                                    }}
                                />
                                <Stack.Screen
                                    name="AdminTopics"
                                    component={AdminTopicsScreen}
                                    options={{
                                        title: 'Quản lý Topics',
                                        headerStyle: { backgroundColor: '#10B981' },
                                    }}
                                />
                                <Stack.Screen
                                    name="AdminVocabulary"
                                    component={AdminVocabularyScreen}
                                    options={{
                                        title: 'Quản lý Vocabulary',
                                        headerStyle: { backgroundColor: '#3B82F6' },
                                    }}
                                />
                                <Stack.Screen
                                    name="AdminUsers"
                                    component={AdminUsersScreen}
                                    options={{
                                        title: 'Quản lý Users',
                                        headerStyle: { backgroundColor: '#F59E0B' },
                                    }}
                                />
                            </>
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <AppNavigator />
            </WebSocketProvider>
        </AuthProvider>
    );
}