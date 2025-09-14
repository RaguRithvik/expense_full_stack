import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoryApi, subcategoryApi, Category, CategoryInput, Subcategory } from '../../services/api';

const GREEN = '#34a853';

// Local type for category with subcategories
type CategoryWithSubcategories = { 
  _id: string; 
  name: string; 
  subcategories: string[];
  created_at?: string;
  updated_at?: string;
};

export default function CategoryScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryWithSubcategories | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all categories
      const categoriesData = await categoryApi.getAll();
      
      // For each category, get its subcategories
      const categoriesWithSubcats = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const subcats = await subcategoryApi.getByCategory(category._id);
            return {
              ...category,
              subcategories: subcats.map(subcat => subcat.name)
            };
          } catch (err) {
            console.error(`Error fetching subcategories for ${category._id}:`, err);
            return {
              ...category,
              subcategories: []
            };
          }
        })
      );
      
      setCategories(categoriesWithSubcats);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    newSubcategory: ''
  });
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    name: '',
    subcategories: ''
  });
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      subcategories: ''
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
      isValid = false;
    }

    if (subcategories.length === 0) {
      newErrors.subcategories = 'At least one subcategory is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      newSubcategory: ''
    });
    setSubcategories([]);
    setErrors({
      name: '',
      subcategories: ''
    });
    setModalVisible(true);
  };

  const openEditModal = (item: CategoryWithSubcategories) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      newSubcategory: ''
    });
    setSubcategories([...item.subcategories]);
    setErrors({
      name: '',
      subcategories: ''
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (editingItem) {
        // Update existing category
        await categoryApi.update(editingItem._id, { name: formData.name });
        
        // Delete existing subcategories and create new ones
        const existingSubcats = await subcategoryApi.getByCategory(editingItem._id);
        
        // Delete existing subcategories
        await Promise.all(
          existingSubcats.map(subcat => subcategoryApi.delete(subcat._id))
        );
        
        // Create new subcategories
        await Promise.all(
          subcategories.map(subcatName => 
            subcategoryApi.create({
              name: subcatName,
              category_id: editingItem._id
            })
          )
        );
      } else {
        // Add new category
        const newCategory = await categoryApi.create({ name: formData.name });
        
        // Create subcategories for the new category
        await Promise.all(
          subcategories.map(subcatName => 
            subcategoryApi.create({
              name: subcatName,
              category_id: newCategory._id
            })
          )
        );
      }
      
      // Refresh categories list
      await fetchCategories();
      setModalVisible(false);
    } catch (err) {
      console.error('Error saving category:', err);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const addSubcategory = () => {
    const value = formData.newSubcategory.trim();
    if (!value) return;
    
    if (!subcategories.includes(value)) {
      setSubcategories([...subcategories, value]);
    }
    
    setFormData(prev => ({ ...prev, newSubcategory: '' }));
  };
  
  const removeSubcategory = (index: number) => {
    const newSubcategories = [...subcategories];
    newSubcategories.splice(index, 1);
    setSubcategories(newSubcategories);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Get subcategories for this category
              const subcats = await subcategoryApi.getByCategory(id);
              
              // Delete all subcategories first
              await Promise.all(
                subcats.map(subcat => subcategoryApi.delete(subcat._id))
              );
              
              // Delete the category
              await categoryApi.delete(id);
              
              // Refresh the list
              await fetchCategories();
            } catch (err) {
              console.error('Error deleting category:', err);
              Alert.alert('Error', 'Failed to delete category. Please try again.');
              setLoading(false);
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
        <Text style={styles.headerTitle}>Categories</Text>
        <Pressable hitSlop={8} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={{flex: 1}}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color={GREEN} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No categories yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add a category</Text>
          </View>
        ) : (
          categories.map((item) => (
            <View key={item._id} style={styles.row}>
              <View style={styles.icon}><Ionicons name="pricetags" size={16} color={GREEN} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.subcategories.join(' · ')}</Text>
              </View>
              <View style={styles.actionButtons}>
                <Pressable hitSlop={8} style={styles.editButton} onPress={() => openEditModal(item)}>
                  <Feather name="edit" size={16} color={GREEN} />
                </Pressable>
                <Pressable hitSlop={8} style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                </Pressable>
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
                {editingItem ? 'Edit Category' : 'Add Category'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category Name *</Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Food, Transport"
                  placeholderTextColor="#999"
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subcategories *</Text>
                <View style={styles.subcategoryInputContainer}>
                  <TextInput
                    style={styles.subcategoryInput}
                    value={formData.newSubcategory}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, newSubcategory: text }))}
                    placeholder="Add a subcategory"
                    placeholderTextColor="#999"
                    onSubmitEditing={addSubcategory}
                    returnKeyType="done"
                  />
                  <TouchableOpacity 
                    style={styles.addSubcategoryButton} 
                    onPress={addSubcategory}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                {subcategories.length > 0 ? (
                  <View style={styles.subcategoryChipsContainer}>
                    {subcategories.map((subcat, index) => (
                      <View key={index} style={styles.subcategoryChip}>
                        <Text style={styles.subcategoryChipText}>{subcat}</Text>
                        <TouchableOpacity 
                          onPress={() => removeSubcategory(index)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-circle" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}
                
                {errors.subcategories ? <Text style={styles.errorText}>{errors.subcategories}</Text> : null}
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
                style={[styles.saveButton, submitting && styles.disabledButton]} 
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingItem ? 'Update' : 'Save'}
                  </Text>
                )}
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
    height: 300,
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
    height: 300,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#999',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GREEN,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(46,130,124,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  sub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
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
  // Subcategory styles
  subcategoryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subcategoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  addSubcategoryButton: {
    backgroundColor: GREEN,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcategoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,130,124,0.15)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  subcategoryChipText: {
    color: GREEN,
    marginRight: 6,
    fontSize: 14,
  },
});
