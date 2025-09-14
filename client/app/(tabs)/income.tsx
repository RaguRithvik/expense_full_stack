import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IncomeItem, useIncome } from '../../contexts/IncomeContext';
import { getCurrentDateFormatted, validateDateString } from '../../utils/dateUtils';

const GREEN = '#34a853';

export default function IncomeScreen() {
  const router = useRouter();
  const { 
    incomeItems, 
    addIncome, 
    updateIncome, 
    deleteIncome, 
    getTotalIncome, 
    refreshData, 
    isRefreshing 
  } = useIncome();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: '',
    description: ''
  });
  const [errors, setErrors] = useState({
    source: '',
    amount: '',
    date: ''
  });

  // Auto-refresh when tab becomes active
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const validateForm = () => {
    const newErrors = {
      source: '',
      amount: '',
      date: ''
    };

    if (!formData.source.trim()) {
      newErrors.source = 'Source is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    } else if (!validateDateString(formData.date)) {
      newErrors.date = 'Date format: MMM DD, YYYY (e.g., Sep 15, 2024)';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      source: '',
      amount: '',
      date: getCurrentDateFormatted(),
      description: ''
    });
    setErrors({
      source: '',
      amount: '',
      date: ''
    });
    setModalVisible(true);
  };

  const openEditModal = (item: IncomeItem) => {
    setEditingItem(item);
    setFormData({
      source: item.source,
      amount: item.amount.toString(),
      date: item.date,
      description: item.description || ''
    });
    setErrors({
      source: '',
      amount: '',
      date: ''
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const newItem = {
      source: formData.source.trim(),
      amount: Number(formData.amount),
      date: formData.date.trim(),
      description: formData.description.trim() || undefined
    };

    if (editingItem) {
      // Edit existing item
      updateIncome(editingItem.id, newItem);
    } else {
      // Add new item
      addIncome(newItem);
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteIncome(id)
        }
      ]
    );
  };

  const setTodayDate = () => {
    setFormData(prev => ({ ...prev, date: getCurrentDateFormatted() }));
  };

  const totalIncome = getTotalIncome();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Monthly Income</Text>
        <Pressable hitSlop={8} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Income</Text>
        <Text style={styles.summaryAmount}>₹ {totalIncome.toLocaleString()}</Text>
        {isRefreshing && (
          <View style={styles.refreshIndicator}>
            <Ionicons name="refresh" size={16} color={GREEN} />
            <Text style={styles.refreshText}>Refreshing...</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={[GREEN]}
            tintColor={GREEN}
          />
        }
      >
        {incomeItems.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.avatar}>
              <Ionicons name="cash-outline" size={16} color={GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.source}</Text>
              <Text style={styles.date}>{item.date}</Text>
              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}
            </View>
            <Text style={styles.amount}>+ ₹ {item.amount.toLocaleString()}</Text>
            <View style={styles.actionButtons}>
              <Pressable hitSlop={8} style={styles.editButton} onPress={() => openEditModal(item)}>
                <Feather name="edit" size={16} color={GREEN} />
              </Pressable>
              <Pressable hitSlop={8} style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>


      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Income' : 'Add Income'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Source *</Text>
                <TextInput
                  style={[styles.input, errors.source ? styles.inputError : null]}
                  value={formData.source}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, source: text }))}
                  placeholder="e.g., Salary, Freelance"
                  placeholderTextColor="#999999"
                />
                {errors.source ? <Text style={styles.errorText}>{errors.source}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput
                  style={[styles.input, errors.amount ? styles.inputError : null]}
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  placeholder="0"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                />
                {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date *</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.input, styles.dateInput, errors.date ? styles.inputError : null]}
                    value={formData.date}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                    placeholder="Sep 15, 2024"
                    placeholderTextColor="#999999"
                  />
                  <TouchableOpacity style={styles.todayButton} onPress={setTodayDate}>
                    <Text style={styles.todayButtonText}>Today</Text>
                  </TouchableOpacity>
                </View>
                {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Add a description"
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN,
  },
  summaryLabel: { 
    color: '#666', 
    fontSize: 14, 
    fontWeight: '600',
    marginBottom: 4 
  },
  summaryAmount: { 
    color: GREEN, 
    fontSize: 24, 
    fontWeight: '800' 
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  refreshText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GREEN,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52,168,83,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  date: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  description: { 
    fontSize: 11, 
    color: '#666', 
    marginTop: 2,
    fontStyle: 'italic'
  },
  amount: { fontSize: 14, color: GREEN, fontWeight: '800', marginRight: 10 },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GREEN,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
  },
  todayButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
