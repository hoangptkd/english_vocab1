// AdminVocabularyScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, Alert, Modal, ActivityIndicator
} from 'react-native';
import { adminAPI } from '../services/api';
import { Picker } from '@react-native-picker/picker';

export default function AdminVocabularyScreen() {
    const [vocabularies, setVocabularies] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    const [modalVisible, setModalVisible] = useState(false);
    const [editingVocab, setEditingVocab] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [filterTopic, setFilterTopic] = useState('all');

    const [formData, setFormData] = useState({
        word: '', pronunciation: '', meaning: '', example: '',
        level: 'beginner', topicId: ''
    });

    const levels = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];

    useEffect(() => {
        // load topics 1 lần
        (async () => {
            try {
                const topicRes = await adminAPI.getTopics({ page: 1, limit: 1000 });
                const tData = Array.isArray(topicRes)
                    ? topicRes
                    : (topicRes?.topics ?? []);
                setTopics(tData);
            } catch (e) {
                console.error(e);
                Alert.alert('Lỗi', 'Không thể tải Topics');
            }
        })();
    }, []);

    useEffect(() => {
        loadVocabularies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, filterLevel, filterTopic]);

    // tìm kiếm: debounce nhẹ với derived key
    const searchKey = useMemo(() => searchQuery.trim(), [searchQuery]);
    useEffect(() => {
        // Mỗi lần đổi search -> quay về trang 1
        const id = setTimeout(() => {
            setPage(1);
            loadVocabularies(1);
        }, 350);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchKey]);

    const loadVocabularies = async (customPage) => {
        try {
            setLoading(true);
            const req = {
                page: customPage ?? page,
                limit,
                search: searchKey || undefined,
                level: filterLevel !== 'all' ? filterLevel : undefined,
                topicId: filterTopic !== 'all' ? filterTopic : undefined,
            };
            const res = await adminAPI.getVocabularies(req);
            // support 2 dạng response
            const list = Array.isArray(res) ? res : (res?.vocabs ?? res?.items ?? []);
            const pg = Array.isArray(res)
                ? { total: list.length, page: req.page, limit: req.limit, pages: 1 }
                : (res?.pagination ?? { total: list.length, page: req.page, limit: req.limit, pages: 1 });

            setVocabularies(list);
            setPagination(pg);
        } catch (error) {
            console.error('Error loading vocabularies:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingVocab(null);
        setFormData({
            word: '', pronunciation: '', meaning: '', example: '',
            level: 'beginner', topicId: topics[0]?._id || ''
        });
        setModalVisible(true);
    };

    const handleEdit = (vocab) => {
        setEditingVocab(vocab);
        setFormData({
            word: vocab.word,
            pronunciation: vocab.pronunciation || '',
            meaning: vocab.meaning,
            example: vocab.example  || '',
            level: vocab.level,
            topicId: vocab.topicId || '',
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.word || !formData.meaning) {
            Alert.alert('Lỗi', 'Vui lòng điền từ và nghĩa');
            return;
        }
        try {
            if (editingVocab) {
                await adminAPI.updateVocabulary(editingVocab._id, formData);
                Alert.alert('Thành công', 'Cập nhật từ vựng thành công');
            } else {
                await adminAPI.createVocabulary(formData);
                Alert.alert('Thành công', 'Tạo từ vựng mới thành công');
            }
            setModalVisible(false);
            // reload trang hiện tại (hoặc quay về trang 1 tùy ý bạn)
            loadVocabularies();
        } catch (error) {
            console.error('Error saving vocabulary:', error);
            Alert.alert('Lỗi', 'Không thể lưu từ vựng');
        }
    };

    const handleDelete = (vocabId) => {
        Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa từ này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await adminAPI.deleteVocabulary(vocabId);
                        Alert.alert('Thành công', 'Đã xóa từ vựng');
                        // sau khi xóa, nếu trang rỗng -> lùi trang
                        const remaining = vocabularies.length - 1;
                        if (remaining <= 0 && page > 1) {
                            setPage(p => Math.max(1, p - 1));
                        } else {
                            loadVocabularies();
                        }
                    } catch (error) {
                        console.error('Error deleting vocabulary:', error);
                        Alert.alert('Lỗi', 'Không thể xóa từ vựng');
                    }
                },
            },
        ]);
    };

    const getLevelColor = (level) => {
        const colors = {
            beginner: '#EF4444',
            intermediate: '#F59E0B',
            advanced: '#3B82F6',
            expert: '#059669',
            master: '#8B5CF6',
        };
        return colors[level] || '#6B7280';
    };

    const canPrev = page > 1;
    const canNext = page < (pagination?.pages || 1);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Vocabulary</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
                    <Text style={styles.addButtonText}>+ Thêm mới</Text>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Tìm kiếm từ..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <View style={styles.filterRow}>
                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>Level:</Text>
                        <Picker
                            selectedValue={filterLevel}
                            style={styles.picker}
                            onValueChange={(value) => { setFilterLevel(value); setPage(1); }}
                        >
                            <Picker.Item label="Tất cả" value="all" />
                            {levels.map((level) => (
                                <Picker.Item key={level} label={level} value={level} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>Topic:</Text>
                        <Picker
                            selectedValue={filterTopic}
                            style={styles.picker}
                            onValueChange={(value) => { setFilterTopic(value); setPage(1); }}
                        >
                            <Picker.Item label="Tất cả" value="all" />
                            {topics.map((topic) => (
                                <Picker.Item key={topic._id} label={topic.name} value={topic._id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Page Size */}
                <View style={[styles.filterRow, { marginTop: 8 }]}>
                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>Số dòng / trang:</Text>
                        <Picker
                            selectedValue={limit}
                            style={styles.picker}
                            onValueChange={(value) => { setLimit(value); setPage(1); }}
                        >
                            {[5, 10, 20, 50].map(sz => <Picker.Item key={sz} label={`${sz}`} value={sz} />)}
                        </Picker>
                    </View>
                </View>
            </View>

            {/* List */}
            <ScrollView style={styles.content}>
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 16 }} />
                ) : (
                    <>
                        <Text style={styles.resultCount}>
                            Tìm thấy {pagination?.total ?? vocabularies.length} từ • Trang {pagination?.page}/{pagination?.pages}
                        </Text>
                        {vocabularies.map((vocab) => (
                            <View key={vocab._id} style={styles.vocabCard}>
                                <View style={styles.vocabHeader}>
                                    <Text style={styles.vocabWord}>{vocab.word}</Text>
                                    <View
                                        style={[styles.levelBadge, { backgroundColor: getLevelColor(vocab.level) }]}
                                    >
                                        <Text style={styles.levelText}>{vocab.level}</Text>
                                    </View>
                                </View>
                                {!!vocab.pronunciation && (
                                    <Text style={styles.vocabPronunciation}>{vocab.pronunciation}</Text>
                                )}
                                <Text style={styles.vocabMeaning}>{vocab.meaning}</Text>
                                {!!vocab.examples[0]?.sentence && (
                                    <Text style={styles.vocabExample}>"{vocab.examples[0].sentence}"</Text>
                                )}
                                <View style={styles.vocabActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                                        onPress={() => handleEdit(vocab)}
                                    >
                                        <Text style={styles.actionButtonText}>✏️ Sửa</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                                        onPress={() => handleDelete(vocab._id)}
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
                    <ScrollView style={styles.modalScrollView}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {editingVocab ? 'Sửa Vocabulary' : 'Tạo Vocabulary Mới'}
                            </Text>

                            <Text style={styles.label}>Từ vựng *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.word}
                                onChangeText={(text) => setFormData({ ...formData, word: text })}
                                placeholder="Nhập từ vựng"
                            />

                            <Text style={styles.label}>Phiên âm</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.pronunciation}
                                onChangeText={(text) => setFormData({ ...formData, pronunciation: text })}
                                placeholder="/example/"
                            />

                            <Text style={styles.label}>Nghĩa *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.meaning}
                                onChangeText={(text) => setFormData({ ...formData, meaning: text })}
                                placeholder="Nhập nghĩa"
                            />

                            <Text style={styles.label}>Ví dụ</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.example}
                                onChangeText={(text) => setFormData({ ...formData, example: text })}
                                placeholder="Nhập câu ví dụ"
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.label}>Level *</Text>
                            <Picker
                                selectedValue={formData.level}
                                style={styles.input}
                                onValueChange={(value) => setFormData({ ...formData, level: value })}
                            >
                                {levels.map((level) => (
                                    <Picker.Item key={level} label={level} value={level} />
                                ))}
                            </Picker>

                            <Text style={styles.label}>Topic</Text>
                            <Picker
                                selectedValue={formData.topicId}
                                style={styles.input}
                                onValueChange={(value) => setFormData({ ...formData, topicId: value })}
                            >
                                <Picker.Item label="Chọn topic" value="" />
                                {topics.map((topic) => (
                                    <Picker.Item key={topic._id} label={topic.name} value={topic._id} />
                                ))}
                            </Picker>

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
                    </ScrollView>
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
        backgroundColor: '#3B82F6',
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
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 14,
    },
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#F9FAFB',
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
    },
    filterItem: {
        flex: 1,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    picker: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    resultCount: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    vocabCard: {
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
    vocabHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    vocabWord: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    levelBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    vocabPronunciation: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    vocabMeaning: {
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 8,
    },
    vocabExample: {
        fontSize: 14,
        color: '#4B5563',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    vocabActions: {
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
    },
    modalScrollView: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        margin: 20,
        marginTop: 60,
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
        height: 80,
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
        backgroundColor: '#3B82F6',
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
    pgBtnDisabled: {
        opacity: 0.4,
    },
    pgBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    pgInfo: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
    },
});