// navigation/BottomTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import TopicsScreen from '../screens/TopicsScreen';
import ReviewScreen from '../screens/ReviewScreen';

const Tab = createBottomTabNavigator();

// Placeholder screens (sẽ phát triển sau)
const DictionaryScreen = () => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📖</Text>
        <Text style={styles.placeholderTitle}>Tra từ</Text>
        <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
    </View>
);

const ConversationScreen = () => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>💬</Text>
        <Text style={styles.placeholderTitle}>Hội thoại</Text>
        <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
    </View>
);

const MochiHubScreen = () => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>🌐</Text>
        <Text style={styles.placeholderTitle}>MochiHub</Text>
        <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
    </View>
);

export default function BottomTabNavigator() {
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
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Tra từ',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { color }]}>🔍</Text>
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
                            <Text style={[styles.tabIcon, { color }]}>🎓</Text>
                        </View>
                    ),
                }}
            />

            <Tab.Screen
                name="ReviewTab"
                component={ReviewScreen}
                options={{
                    tabBarLabel: 'Ôn tập từ vựng',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { color }]}>📊</Text>
                        </View>
                    ),
                }}
            />

            <Tab.Screen
                name="ConversationTab"
                component={ConversationScreen}
                options={{
                    tabBarLabel: 'Hội thoại',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { color }]}>💬</Text>
                        </View>
                    ),
                }}
            />

            <Tab.Screen
                name="MochiHubTab"
                component={MochiHubScreen}
                options={{
                    tabBarLabel: 'MochiHub',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Text style={[styles.tabIcon, { color }]}>🌐</Text>
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
        fontSize: 11,
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