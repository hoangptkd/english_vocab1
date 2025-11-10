// screens/TopicsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {adminAPI, vocabularyAPI} from '../services/api';

export default function TopicsScreen({ navigation }) {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        try {
            setLoading(true);
            const res = await vocabularyAPI.getTopics({ page, limit });
            const list = Array.isArray(res) ? res : (res?.topics ?? res?.items ?? []);
            const pg = Array.isArray(res)
                ? { total: list.length, page, limit, pages: 1 }
                : (res?.pagination ?? { total: list.length, page, limit, pages: 1 });

            setTopics(list);
            setPagination(pg);
        } catch (error) {
            console.error('Error loading topics:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách topics');
        } finally {
            setLoading(false);
        }
    };

    const handleTopicPress = (topic) => {
        navigation.navigate('LearnNew', {
            topicId: topic._id,
            topicName: topic.name
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📚 Chọn chủ đề học tập</Text>
                <Text style={styles.subtitle}>Chọn một chủ đề để bắt đầu học</Text>
            </View>

            <View style={styles.topicsContainer}>
                {topics.map((topic, index) => (
                    <TouchableOpacity
                        key={topic._id}
                        style={[
                            styles.topicCard,
                            { backgroundColor: getTopicColor(index) }
                        ]}
                        onPress={() => handleTopicPress(topic)}
                    >
                        <Text style={styles.topicIcon}>{getTopicIcon(index)}</Text>
                        <View style={styles.topicContent}>
                            <Text style={styles.topicName}>{topic.name}</Text>
                            {topic.description && (
                                <Text style={styles.topicDescription}>{topic.description}</Text>
                            )}
                        </View>
                        <Text style={styles.topicArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const getTopicColor = (index) => {
    const colors = [
        '#4F46E5', // Indigo
        '#059669', // Green
        '#DC2626', // Red
        '#F59E0B', // Amber
        '#8B5CF6', // Purple
        '#0891B2', // Cyan
    ];
    return colors[index % colors.length];
};

const getTopicIcon = (index) => {
    const icons = ['📖', '🌟', '🎯', '💡', '🚀', '🎨'];
    return icons[index % icons.length];
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    header: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    topicsContainer: {
        padding: 20,
    },
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    topicIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    topicContent: {
        flex: 1,
    },
    topicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    topicDescription: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    topicArrow: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});