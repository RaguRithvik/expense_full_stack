import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { budgetApi, Budget, BudgetInput } from '../../services/api';

const GREEN = '#34a853';

// Map API Budget type to UI BudgetRow type
type BudgetRow = {
  id: string;
  label: string;
  amount: number;
};

export default function BudgetScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetRow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    amount: ''
  });
  
  // Function to fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const budgets = await budgetApi.getAll();
      // Map API budgets to UI format
      const mappedBudgets = budgets.map((budget: Budget) => ({
        id: budget._id,
        label: budget.name,
        amount: budget.amount
      }));
      setRows(mappedBudgets);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to load budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {
      name: '',
      amount: ''
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      amount: ''
    });
    setErrors({
      name: '',
      amount: ''
    });
    setModalVisible(true);
  };

  const openEditModal = (item: BudgetRow) => {
    setEditingItem(item);
    setFormData({
      name: item.label,
      amount: String(item.amount)
    });
    setErrors({
      name: '',
      amount: ''
    });
    setModalVisible(true);
  };

  // Load budgets when component mounts
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const budgetData: BudgetInput = {
        amount: Number(formData.amount),
        name: formData.name.trim()
      };

      if (editingItem) {
        // Edit existing item
        await budgetApi.update(editingItem.id, budgetData);
      } else {
        // Add new item
        await budgetApi.create(budgetData);
      }

      // Refresh budgets after save
      await fetchBudgets();
      setModalVisible(false);
    } catch (err) {
      console.error('Error saving budget:', err);
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetApi.delete(id);
              // Refresh budgets after delete
              await fetchBudgets();
            } catch (err) {
              console.error('Error deleting budget:', err);
              Alert.alert('Error', 'Failed to delete budget. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.push('/settings')}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Budget</Text>
        <Pressable hitSlop={8} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.loadingText}>Loading budgets...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchBudgets}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No budgets found</Text>
            <Text style={styles.emptySubText}>Tap the + button to add a budget</Text>
          </View>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardLabel}>{r.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.cardValue}>₹ {r.amount}</Text>
                <View style={styles.actionButtons}>
                  <Pressable hitSlop={8} style={styles.editButton} onPress={() => openEditModal(r)}>
                    <Feather name="edit" size={16} color={GREEN} />
                  </Pressable>
                  <Pressable hitSlop={8} style={styles.deleteButton} onPress={() => handleDelete(r.id)}>
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
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
                {editingItem ? 'Edit Budget' : 'Add Budget'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Budget Name *</Text>
                <View style={[styles.pickerContainer, errors.name ? styles.inputError : null]}>
                  <Picker
                    selectedValue={formData.name}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a budget type" value="" color="#999" />
                    <Picker.Item label="Monthly" value="Monthly" />
                    <Picker.Item label="Weekly" value="Weekly" />
                    <Picker.Item label="Today" value="Today" />
                  </Picker>
                </View>
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput
                  style={[styles.input, errors.amount ? styles.inputError : null]}
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  placeholder="e.g., 1000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
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
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E6E7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: { color: '#6B6E70', fontSize: 14, fontWeight: '600' },
  cardValue: { color: '#1A1A1A', fontSize: 18, fontWeight: '800' },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
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
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorMessage: {
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  picker: {
    height: 50,
    marginHorizontal: -8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});
