// contexts/WebSocketContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

// // WebSocket URL
// const LAN = '192.168.1.12:3000';
// const SOCKET_URL = Platform.select({
//     android: 'http://10.0.2.2:3000',
//     ios: `http://${LAN}`,
//     default: 'http://localhost:3000'
// });
// --------- ENV / SOCKET URL ----------
const PROD_SOCKET_ROOT = 'https://english-vocab-it2k.onrender.com';
const DEV_SOCKET_ROOT_ANDROID = 'http://10.0.2.2:3000';
const DEV_SOCKET_ROOT_IOS = 'http://192.168.1.7:3000';
const DEV_SOCKET_ROOT_WEB = 'http://localhost:3000';
const SOCKET_URL =
    __DEV__
        ? (Platform.OS === 'android' ? DEV_SOCKET_ROOT_ANDROID :  (Platform.OS === 'ios' ? PROD_SOCKET_ROOT : DEV_SOCKET_ROOT_WEB))
        : PROD_SOCKET_ROOT;
export const WebSocketProvider  = ({ children }) => {
    const { user, updateUserData } = useAuth();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastPaymentNotification, setLastPaymentNotification] = useState(null);

    useEffect(() => {
        if (user) {
            connectWebSocket();
        } else {
            disconnectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [user]);

    const connectWebSocket = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');

            if (!token) {
                console.log('❌ No token found, cannot connect WebSocket');
                return;
            }

            // Ngắt kết nối cũ nếu có
            if (socketRef.current?.connected) {
                socketRef.current.disconnect();
            }

            console.log('🔌 Connecting to WebSocket:', SOCKET_URL);

            socketRef.current = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });
            socketRef.current.onAny((event, ...args) => {
                console.log('📥 [onAny]', event, JSON.stringify(args));
            });
            // Connection events
            socketRef.current.on('connect', () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', (reason) => {
                console.log('❌ WebSocket disconnected:', reason);
                setIsConnected(false);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('🔴 WebSocket connection error:', error.message);
                setIsConnected(false);
            });

            // 🔥 PAYMENT SUCCESS EVENT
            socketRef.current.on('payment:success', async (data) => {
                console.log('💰 Payment success received:', data);

                // 🔥 Thêm timestamp và ID unique để track notification
                const notification = {
                    ...data,
                    id: `payment-${Date.now()}`,
                    timestamp: Date.now(),
                    success: true
                };

                setLastPaymentNotification(data);

                // Tự động cập nhật totalPoints trong user context
                if (updateUserData && user) {
                    const updatedUser = {
                        ...user,
                        totalPoints: data.totalPoints
                    };
                    await updateUserData(updatedUser);
                    console.log('✅ User points updated automatically:', data.totalPoints);
                }

                // Có thể hiển thị toast notification ở đây
                // Toast.show({ type: 'success', text1: data.message });
            });

            // 🔥 PAYMENT FAILED EVENT
            socketRef.current.on('payment:failed', (data) => {
                console.log('❌ Payment failed received:', data);
                // 🔥 Thêm timestamp và ID unique
                const notification = {
                    ...data,
                    id: `payment-${Date.now()}`,
                    timestamp: Date.now(),
                    success: false
                };
                setLastPaymentNotification(data);

                // Có thể hiển thị toast notification ở đây
                // Toast.show({ type: 'error', text1: data.message });
            });

        } catch (error) {
            console.error('Error connecting WebSocket:', error);
        }
    };

    const disconnectWebSocket = () => {
        if (socketRef.current) {
            console.log('🔌 Disconnecting WebSocket');
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    };

    // 🔥 Method để clear notification
    const clearPaymentNotification = () => {
        console.log('🧹 Clearing payment notification');
        setLastPaymentNotification(null);
    };

    const emit = (event, data) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        } else {
            console.warn('Cannot emit, socket not connected');
        }
    };

    const on = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    };

    const off = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback);
        }
    };

    const value = {
        socket: socketRef.current,
        isConnected,
        lastPaymentNotification,
        clearPaymentNotification,
        emit,
        on,
        off,
        reconnect: connectWebSocket,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};