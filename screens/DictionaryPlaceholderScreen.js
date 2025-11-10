// screens/DictionaryPlaceholderScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';

export default function DictionaryPlaceholderScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tra từ</Text>
            </View>

            {/* Content */}
            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🔍</Text>
                </View>

                <Text style={styles.title}>Tính năng đang phát triển</Text>
                <Text style={styles.description}>
                    Chức năng tra từ điển sẽ sớm được cập nhật để phục vụ bạn tốt hơn.
                </Text>

                <View style={styles.featuresContainer}>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>✨</Text>
                        <Text style={styles.featureText}>Tra từ nhanh chóng</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🔊</Text>
                        <Text style={styles.featureText}>Phát âm chuẩn</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>📝</Text>
                        <Text style={styles.featureText}>Ví dụ minh họa</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>💾</Text>
                        <Text style={styles.featureText}>Lưu từ yêu thích</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('TopicsTab')}
                >
                    <Text style={styles.actionButtonText}>Học từ vựng ngay</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#10B981',
    },
    header: {
        backgroundColor: '#10B981',
        padding: 16,
        paddingTop: 12,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    icon: {
        fontSize: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    featuresContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    featureText: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '600',
    },
    actionButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});