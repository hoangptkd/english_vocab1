// AdminUsersScreen.js
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
} from 'react-native';
import { adminAPI } from '../services/api';
import { Picker } from '@react-native-picker/picker';

export default function AdminUsersScreen() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterActive, setFilterActive] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        isActive: true,
    });

    useEffect(() => {
        loadUsers();
    }, [page, searchQuery, filterRole, filterActive]);

    const loadUsers = async () => {
        try {
            const params = { page, limit: 10 };
            if (searchQuery) params.search = searchQuery;
            if (filterRole !== 'all') params.role = filterRole;
            if (filterActive !== 'all') params.isActive = filterActive === 'active';

            const response = await adminAPI.getUsers(params);
            setUsers(response.users);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Error loading users:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.email) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            await adminAPI.updateUser(editingUser._id, formData);
            Alert.alert('Thành công', 'Cập nhật người dùng thành công');
            setModalVisible(false);
            loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật người dùng');
        }
    };

    const handleResetPassword = (userId) => {
        Alert.alert(
            'Reset mật khẩu',
            'Nhập mật khẩu mới cho người dùng:',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Reset',
                    onPress: async () => {
                        const newPassword = 'newpassword123'; // Trong thực tế, nên có input dialog
                        try {
                            await adminAPI.resetUserPassword(userId, newPassword);
                            Alert.alert('Thành công', `Mật khẩu mới: ${newPassword}`);
                        } catch (error) {
                            console.error('Error resetting password:', error);
                            Alert.alert('Lỗi', 'Không thể reset mật khẩu');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleActive = async (userId, currentStatus) => {
        const action = currentStatus ? 'vô hiệu hóa' : 'kích hoạt';
        Alert.alert(
            'Xác nhận',
            `Bạn có chắc muốn ${action} tài khoản này?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        try {
                            await adminAPI.updateUser(userId, { isActive: !currentStatus });
                            Alert.alert('Thành công', `Đã ${action} tài khoản`);
                            loadUsers();
                        } catch (error) {
                            console.error('Error toggling user status:', error);
                            Alert.alert('Lỗi', 'Không thể thay đổi trạng thái');
                        }
                    },
                },
            ]
        );
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: '#EF4444',
            premium: '#F59E0B',
            user: '#3B82F6',
        };
        return colors[role] || '#6B7280';
    };

    const getRoleName = (role) => {
        const names = {
            admin: 'Quản trị viên',
            premium: 'Premium',
            user: 'Người dùng',
        };
        return names[role] || role;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Users</Text>
                <Text style={styles.headerSubtitle}>
                    Trang {page}/{totalPages}
                </Text>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Tìm kiếm theo email hoặc tên..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <View style={styles.filterRow}>
                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>Role:</Text>
                        <Picker
                            selectedValue={filterRole}
                            style={styles.picker}
                            onValueChange={(value) => setFilterRole(value)}
                        >
                            <Picker.Item label="Tất cả" value="all" />
                            <Picker.Item label="Admin" value="admin" />
                            <Picker.Item label="Premium" value="premium" />
                            <Picker.Item label="User" value="user" />
                        </Picker>
                    </View>
                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>Trạng thái:</Text>
                        <Picker
                            selectedValue={filterActive}
                            style={styles.picker}
                            onValueChange={(value) => setFilterActive(value)}
                        >
                            <Picker.Item label="Tất cả" value="all" />
                            <Picker.Item label="Hoạt động" value="active" />
                            <Picker.Item label="Vô hiệu" value="inactive" />
                        </Picker>
                    </View>
                </View>
            </View>

            {/* Users List */}
            <ScrollView style={styles.content}>
                {users.map((user) => (
                    <View key={user._id} style={styles.userCard}>
                        <View style={styles.userHeader}>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userEmail}>{user.email}</Text>
                            </View>
                            <View style={styles.badges}>
                                <View
                                    style={[
                                        styles.roleBadge,
                                        { backgroundColor: getRoleColor(user.role) },
                                    ]}
                                >
                                    <Text style={styles.badgeText}>{getRoleName(user.role)}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor: user.isActive ? '#D1FAE5' : '#FEE2E2',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.badgeText,
                                            { color: user.isActive ? '#065F46' : '#991B1B' },
                                        ]}
                                    >
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.userStats}>
                            <Text style={styles.statText}>
                                📅 Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>

                        <View style={styles.userActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                                onPress={() => handleEdit(user)}
                            >
                                <Text style={styles.actionButtonText}>✏️ Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                                onPress={() => handleResetPassword(user._id)}
                            >
                                <Text style={styles.actionButtonText}>🔑 Reset PW</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    {
                                        backgroundColor: user.isActive ? '#EF4444' : '#10B981',
                                    },
                                ]}
                                onPress={() => handleToggleActive(user._id, user.isActive)}
                            >
                                <Text style={styles.actionButtonText}>
                                    {user.isActive ? '🚫 Vô hiệu' : '✅ Kích hoạt'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Pagination */}
            <View style={styles.pagination}>
                <TouchableOpacity
                    style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                    onPress={() => setPage(page - 1)}
                    disabled={page === 1}
                >
                    <Text style={styles.pageButtonText}>← Trước</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                    Trang {page} / {totalPages}
                </Text>
                <TouchableOpacity
                    style={[
                        styles.pageButton,
                        page === totalPages && styles.pageButtonDisabled,
                    ]}
                    onPress={() => setPage(page + 1)}
                    disabled={page === totalPages}
                >
                    <Text style={styles.pageButtonText}>Sau →</Text>
                </TouchableOpacity>
            </View>

            {/* Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chỉnh sửa User</Text>

                        <Text style={styles.label}>Tên *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Nhập tên"
                        />

                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            placeholder="Nhập email"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Role *</Text>
                        <Picker
                            selectedValue={formData.role}
                            style={styles.input}
                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                            <Picker.Item label="User" value="user" />
                            <Picker.Item label="Premium" value="premium" />
                            <Picker.Item label="Admin" value="admin" />
                        </Picker>

                        <Text style={styles.label}>Trạng thái</Text>
                        <Picker
                            selectedValue={formData.isActive}
                            style={styles.input}
                            onValueChange={(value) =>
                                setFormData({ ...formData, isActive: value })
                            }
                        >
                            <Picker.Item label="Hoạt động" value={true} />
                            <Picker.Item label="Vô hiệu hóa" value={false} />
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
        backgroundColor: '#F59E0B',
        padding: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 4,
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
    userCard: {
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
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    badges: {
        gap: 4,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    userStats: {
        marginBottom: 12,
    },
    statText: {
        fontSize: 13,
        color: '#6B7280',
    },
    userActions: {
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
        fontSize: 12,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    pageButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    pageButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    pageButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    pageInfo: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
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
        backgroundColor: '#F59E0B',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});