// navigation/BottomTabNavigator.js
import React, {useState} from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet, Animated} from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import TopicsScreen from '../screens/TopicsScreen';
import ReviewScreen from '../screens/ReviewScreen';
import StatsScreen from "../screens/StatsScreen";
import DictionaryPlaceholderScreen from '../screens/DictionaryPlaceholderScreen';
import BattleScreen from "../screens/BattleScreen";

const Tab = createBottomTabNavigator();

const ConversationScreen = () => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>💬</Text>
        <Text style={styles.placeholderTitle}>Thi đấu</Text>
        <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
    </View>
);

export default function BottomTabNavigator() {
    const [scaleAnim] = useState(new Animated.Value(1)); // Animation value for scale effect

    const handleTabPress = () => {
        return new Promise((resolve) => {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95, // Shrink the icon
                    duration: 150, // Duration for shrinking
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1, // Return to original size
                    duration: 150, // Duration for expanding back
                    useNativeDriver: true,
                })
            ]).start(() => resolve()); // Resolve the promise once the animation finishes
        });
    };
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#10B981',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarItemStyle: styles.tabBarItem,
            }}
        >
            <Tab.Screen
                name="DictionaryTab"
                component={DictionaryPlaceholderScreen}
                options={{
                    tabBarLabel: 'Tra từ',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>🔍</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="TopicsTab"
                component={TopicsScreen}
                options={{
                    tabBarLabel: 'Học từ vựng',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>🎓</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Ôn tập từ vựng',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>📊</Text>
                        </View>
                    ),
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        // Ngừng hành động mặc định (điều hướng)
                        e.preventDefault();

                        // Điều hướng lại về HomeTab và truyền tham số reloadStats = true
                        navigation.navigate('HomeTab', { reloadStats: true });
                    },
                })}
            />

            <Tab.Screen
                name="BattleTab"
                component={BattleScreen}
                options={{
                    tabBarLabel: 'Thi đấu',
                    tabBarIcon: ({ color, size }) => (
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Text style={{ fontSize: size }}>⚔️</Text>
                        </Animated.View>
                    ),
                    tabBarStyle: { display: 'none' }, // Hide BottomTabNavigator when on BattleScreen
                }}
                listeners={({ navigation }) => ({
                    tabPress: async (e) => {
                        // Apply the animation effect when tab is pressed
                        await handleTabPress();

                        // Navigate to BattleScreen after the animation completes
                        navigation.navigate('MainTabs', { screen: 'BattleTab' });
                    },
                })}
            />

            <Tab.Screen
                name="StatsTab"
                component={StatsScreen}
                options={{
                    tabBarLabel: 'Thống kê',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>🌐</Text>
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    tabBarLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },
    tabBarItem: {
        paddingVertical: 4,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerFocused: {
        backgroundColor: '#D1FAE5',
    },
    tabIcon: {
        fontSize: 24,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    placeholderIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});