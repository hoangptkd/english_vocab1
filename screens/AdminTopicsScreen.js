// AdminTopicsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { adminAPI } from '../services/api';

export default function AdminTopicsScreen() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    const [modalVisible, setModalVisible] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
    });

    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getTopics({ page, limit });
            console.log(res)
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

    const handleCreate = () => {
        setEditingTopic(null);
        setFormData({ name: '', slug: '', description: '' });
        setModalVisible(true);
    };

    const handleEdit = (topic) => {
        setEditingTopic(topic);
        setFormData({
            name: topic.name,
            slug: topic.slug,
            description: topic.description || '',
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            if (editingTopic) {
                await adminAPI.updateTopic(editingTopic._id, formData);
                Alert.alert('Thành công', 'Cập nhật topic thành công');
            } else {
                await adminAPI.createTopic(formData);
                Alert.alert('Thành công', 'Tạo topic mới thành công');
            }
            setModalVisible(false);
            loadTopics();
        } catch (error) {
            console.error('Error saving topic:', error);
            Alert.alert('Lỗi', 'Không thể lưu topic');
        }
    };

    const handleDelete = (topicId) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa topic này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminAPI.deleteTopic(topicId);
                            Alert.alert('Thành công', 'Đã xóa topic');
                            loadTopics();
                        } catch (error) {
                            console.error('Error deleting topic:', error);
                            Alert.alert('Lỗi', 'Không thể xóa topic');
                        }
                    },
                },
            ]
        );
    };

    const canPrev = page > 1;
    const canNext = page < (pagination?.pages || 1);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Topics</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
                    <Text style={styles.addButtonText}>+ Thêm mới</Text>
                </TouchableOpacity>
            </View>

            {/* Page size */}
            <View style={{ backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: '600' }}>Số dòng / trang</Text>
                <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8 }}>
                    <TextInput
                        style={{ padding: 12, fontSize: 14 }}
                        value={String(limit)}
                        keyboardType="number-pad"
                        onChangeText={(txt) => {
                            const v = parseInt(txt || '10', 10);
                            const safe = Number.isNaN(v) ? 10 : Math.min(Math.max(v, 1), 200);
                            setLimit(safe);
                            setPage(1);
                        }}
                        placeholder="10"
                    />
                </View>
            </View>

            {/* List */}
            <ScrollView style={styles.content}>
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 16 }} />
                ) : (
                    <>
                        <Text style={{ color: '#6B7280', marginBottom: 12 }}>
                            Tổng {pagination?.total ?? topics.length} • Trang {pagination?.page}/{pagination?.pages}
                        </Text>

                        {topics.map((topic) => (
                            <View key={topic._id} style={styles.topicCard}>
                                <View style={styles.topicInfo}>
                                    <Text style={styles.topicName}>{topic.name}</Text>
                                    <Text style={styles.topicSlug}>Slug: {topic.slug}</Text>
                                    {!!topic.description && (
                                        <Text style={styles.topicDescription}>{topic.description}</Text>
                                    )}
                                </View>
                                <View style={styles.topicActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                                        onPress={() => handleEdit(topic)}
                                    >
                                        <Text style={styles.actionButtonText}>✏️ Sửa</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                                        onPress={() => handleDelete(topic._id)}
                                    >
                                        <Text style={styles.actionButtonText}>🗑️ Xóa</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* Pagination Bar */}
                        <View style={styles.paginationBar}>
                            <TouchableOpacity
                                style={[styles.pgBtn, !canPrev && styles.pgBtnDisabled]}
                                disabled={!canPrev}
                                onPress={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <Text style={styles.pgBtnText}>« Prev</Text>
                            </TouchableOpacity>
                            <Text style={styles.pgInfo}>Trang {page}/{pagination?.pages || 1}</Text>
                            <TouchableOpacity
                                style={[styles.pgBtn, !canNext && styles.pgBtnDisabled]}
                                disabled={!canNext}
                                onPress={() => setPage(p => p + 1)}
                            >
                                <Text style={styles.pgBtnText}>Next »</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Modal Create/Edit */}
            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingTopic ? 'Sửa Topic' : 'Tạo Topic Mới'}
                        </Text>

                        <Text style={styles.label}>Tên Topic *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Nhập tên topic"
                        />

                        <Text style={styles.label}>Slug *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.slug}
                            onChangeText={(text) => setFormData({ ...formData, slug: text })}
                            placeholder="vi-du-slug"
                        />

                        <Text style={styles.label}>Mô tả</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            placeholder="Nhập mô tả (tùy chọn)"
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#10B981',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    addButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#10B981',
        fontWeight: 'bold',
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    topicCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    topicInfo: {
        marginBottom: 12,
    },
    topicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    topicSlug: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    topicDescription: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 4,
    },
    topicActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#F9FAFB',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E5E7EB',
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: '#10B981',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    paginationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingVertical: 8,
    },
    pgBtn: {
        backgroundColor: '#111827',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    pgBtnDisabled: { opacity: 0.4 },
    pgBtnText: { color: '#fff', fontWeight: '600' },
    pgInfo: { color: '#374151', fontSize: 14, fontWeight: '600' },
});