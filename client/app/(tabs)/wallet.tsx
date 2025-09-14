import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpense } from '../../contexts/ExpenseContext';
import { IncomeItem, useIncome } from '../../contexts/IncomeContext';
import { Category, Subcategory, categoryApi, subcategoryApi } from '../../services/api';
import { convertDisplayDateToAPI, formatDateForAPI, formatDateForDisplay, formatMonthYear, getCurrentDateFormatted, validateDateString } from '../../utils/dateUtils';

const GREEN = '#34a853';

export default function WalletScreen() {
  const router = useRouter();
  // Expense state
  const [name, setName] = useState('Netflix');
  const [amount, setAmount] = useState('₹ 48.00');
  const [date, setDate] = useState('Tue, 22 Feb 2022');
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  
  // Expense form state
  const [newExpense, setNewExpense] = useState({
    categoryId: '',
    categoryName: '',
    subcategoryId: '',
    subcategoryName: '',
    amount: '',
    date: getCurrentDateFormatted(),
    description: ''
  });
  const [expenseErrors, setExpenseErrors] = useState({
    category: '',
    amount: '',
    date: '',
    source: ''
  });
  
  // Category and subcategory state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [subcategoryDropdownVisible, setSubcategoryDropdownVisible] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
  // Confirmation modal states
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'income' | 'expense'} | null>(null);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Expense context
  const {
    expenseItems,
    addExpense,
    updateExpense,
    deleteExpense,
    getTotalExpense,
    refreshData: refreshExpenseData,
    isRefreshing: isExpenseRefreshing,
    totalPages: expenseTotalPages,
    currentPage: expenseCurrentPage,
    loadNextPage: loadNextExpensePage,
    loadPreviousPage: loadPreviousExpensePage
  } = useExpense();
  
  // Income state and functions
  const { 
    incomeItems, 
    addIncome, 
    updateIncome, 
    deleteIncome, 
    getTotalIncome, 
    refreshData, 
    isRefreshing,
    totalPages: incomeTotalPages,
    currentPage: incomeCurrentPage,
    loadNextPage,
    loadPreviousPage
  } = useIncome();
  
  // Local pagination state for UI display
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: '',
    description: ''
  });
  const [incomeErrors, setIncomeErrors] = useState({
    source: '',
    amount: '',
    date: ''
  });

  // Fetch categories and subcategories
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      console.log('Fetching categories...');
      const categoriesData = await categoryApi.getAll();
      console.log('Received categories:', categoriesData);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set empty array to show proper error state in dropdown
      setCategories([]);
      // Optionally show an alert to the user
      Alert.alert(
        'Failed to Load Categories',
        'Unable to fetch categories. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async () => {
    setLoadingSubcategories(true);
    try {
      console.log('Fetching subcategories...');
      const subcategoriesData = await subcategoryApi.getAll();
      console.log('Received subcategories:', subcategoriesData);
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  }, []);

  // Auto-refresh when tab becomes active
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'income') {
        refreshData();
        // Reset to first page when refreshing data
        setCurrentPage(1);
      } else if (activeTab === 'expense') {
        refreshExpenseData();
        // Reset to first page when refreshing data
        setCurrentPage(1);
      }
      // Fetch categories and subcategories regardless of active tab
      fetchCategories();
      fetchSubcategories();
    }, [refreshData, refreshExpenseData, activeTab, fetchCategories, fetchSubcategories])
  );
  
  // Handle pagination for income and expense data
  const handleLoadNextPage = useCallback(() => {
    if (activeTab === 'income') {
      loadNextPage();
    } else {
      loadNextExpensePage();
    }
  }, [activeTab, loadNextPage, loadNextExpensePage]);

  const handleLoadPreviousPage = useCallback(() => {
    if (activeTab === 'income') {
      loadPreviousPage();
    } else {
      loadPreviousExpensePage();
    }
  }, [activeTab, loadPreviousPage, loadPreviousExpensePage]);

  const handleTabChange = (tab: 'expense' | 'income') => {
    setActiveTab(tab);
    // Reset pagination when tab changes
    setCurrentPage(1);
    
    // Refresh data for the selected tab
    if (tab === 'income') {
      refreshData();
    } else {
      refreshExpenseData();
    }
  };
  
  // Get current pagination info based on active tab
  const getCurrentPaginationInfo = () => {
    if (activeTab === 'income') {
      return {
        currentPage: incomeCurrentPage,
        totalPages: incomeTotalPages,
        isRefreshing: isRefreshing
      };
    } else {
      return {
        currentPage: expenseCurrentPage,
        totalPages: expenseTotalPages,
        isRefreshing: isExpenseRefreshing
      };
    }
  };
  
  const paginationInfo = getCurrentPaginationInfo();

  // Income functions
  const validateForm = () => {
    const newErrors = {
      source: '',
      amount: '',
      date: '',
      category: ''
    };

    if (activeTab === 'income') {
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
    } else {
      // Expense validation
      if (!newExpense.categoryId) {
        newErrors.category = 'Category is required';
      }

      if (!newExpense.amount) {
        newErrors.amount = 'Amount is required';
      } else if (isNaN(Number(newExpense.amount)) || Number(newExpense.amount) <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }

      if (!newExpense.date) {
        newErrors.date = 'Date is required';
      }
    }

    if (activeTab === 'income') {
      setIncomeErrors(newErrors);
    } else {
      setExpenseErrors(newErrors);
    }
    return !Object.values(newErrors).some(error => error !== '');
  };

  const openEditExpenseModal = (expense: any) => {
    setEditingExpense(expense);
    
    // Find the category name from the categories array
    const category = categories.find(cat => cat._id === expense.category_id);
    const categoryName = category ? category.name : expense.category || '';
    
    // Find the subcategory name if it exists
    let subcategoryName = '';
    if (expense.subcat_id) {
      const subcategory = subcategories.find(sub => sub._id === expense.subcat_id);
      subcategoryName = subcategory ? subcategory.name : '';
    }
    
    setNewExpense({
      categoryId: expense.category_id || '',
      categoryName: categoryName,
      subcategoryId: expense.subcat_id || '',
      subcategoryName: subcategoryName,
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description || ''
    });
    
    setExpenseErrors({
      category: '',
      amount: '',
      date: '',
      source: ''
    });
    
    // Set the selected date for the calendar
    const expenseDate = new Date(expense.date);
    setSelectedDate(expenseDate);
    setCurrentMonth(expenseDate);
    
    setCategoryDropdownVisible(false);
    setSubcategoryDropdownVisible(false);
    setExpenseModalVisible(true);
  };

  const openAddModal = () => {
    if (activeTab === 'income') {
      setEditingItem(null);
      setFormData({
        source: '',
        amount: '',
        date: getCurrentDateFormatted(),
        description: ''
      });
      setIncomeErrors({
        source: '',
        amount: '',
        date: ''
      });
      setModalVisible(true);
    } else {
      // Reset expense form
      setEditingExpense(null);
      setNewExpense({
        categoryId: '',
        categoryName: '',
        subcategoryId: '',
        subcategoryName: '',
        amount: '',
        date: getCurrentDateFormatted(),
        description: ''
      });
      setExpenseErrors({
        category: '',
        amount: '',
        date: '',
        source: ''
      });
      setSelectedDate(new Date());
      setCurrentMonth(new Date());
      setCategoryDropdownVisible(false);
      setSubcategoryDropdownVisible(false);
      setExpenseModalVisible(true);
    }
  };

  const openEditModal = (item: IncomeItem) => {
    setEditingItem(item);
    setFormData({
      source: item.source,
      amount: item.amount.toString(),
      date: item.date,
      description: item.description || ''
    });
    setIncomeErrors({
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

    // Convert the display date to API format for submission
    const apiDate = formData.date ? convertDisplayDateToAPI(formData.date) : formatDateForAPI(new Date());

    const newItem = {
      source: formData.source.trim(),
      amount: Number(formData.amount),
      date: apiDate,
      description: formData.description.trim() || undefined
    };

    if (editingItem) {
      // Edit existing item
      updateIncome(editingItem.id, newItem);
    } else {
      // Add new item
      addIncome(newItem);
      // Reset to first page when adding new item
      setCurrentPage(1);
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    console.log('handleDelete called with ID:', id);
    
    // Validate ID
    if (!id || id.trim() === '') {
      console.error('Invalid ID provided to handleDelete:', id);
      return;
    }

    // Set the item to delete and show confirmation modal
    setItemToDelete({ id, type: 'income' });
    setDeleteConfirmVisible(true);
  };

  const handleDeleteExpense = (id: string) => {
    console.log('handleDeleteExpense called with ID:', id);
    
    // Validate ID
    if (!id || id.trim() === '') {
      console.error('Invalid ID provided to handleDeleteExpense:', id);
      return;
    }

    // Set the item to delete and show confirmation modal
    setItemToDelete({ id, type: 'expense' });
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      console.log(`Attempting to delete ${itemToDelete.type} with ID:`, itemToDelete.id);
      
      if (itemToDelete.type === 'income') {
        await deleteIncome(itemToDelete.id);
        console.log('Income deleted successfully');
        
        // Refresh data after deletion
        await refreshData();
        
        // Check if we're deleting the last item on the current page
        const totalPages = Math.ceil((incomeItems.length - 1) / 10);
        if (incomeCurrentPage > totalPages && totalPages > 0) {
          loadPreviousPage();
        }
      } else {
        await deleteExpense(itemToDelete.id);
        console.log('Expense deleted successfully');
        
        // Refresh data after deletion
        await refreshExpenseData();
        
        // Check if we're deleting the last item on the current page
        const totalPages = Math.ceil((expenseItems.length - 1) / 10);
        if (expenseCurrentPage > totalPages && totalPages > 0) {
          loadPreviousExpensePage();
        }
      }

      // Close the confirmation modal
      setDeleteConfirmVisible(false);
      setItemToDelete(null);
      
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      // You could show an error modal here instead of Alert
      console.error(`Failed to delete ${itemToDelete.type} entry:`, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  const setTodayDate = () => {
    if (activeTab === 'income') {
      setFormData(prev => ({ ...prev, date: getCurrentDateFormatted() }));
    } else {
      const today = new Date();
      setSelectedDate(today);
      const formattedDate = formatDateForDisplay(today);
      setNewExpense(prev => ({ ...prev, date: formattedDate }));
      // Clear any date error when a valid date is selected
      setExpenseErrors(prev => ({ ...prev, date: '' }));
    }
  };
  
  // Generate calendar days - matches home page exactly
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    // Last day of previous month
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = lastDayOfPrevMonth - firstDayOfMonth + i + 1;
      days.push({ day, isCurrentMonth: false, isPrevMonth: true });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    
    // Next month days
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, isNextMonth: true });
    }
    
    return days;
  };
  
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };
  
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };
  
  const handleDaySelect = (day: number, isCurrentMonth: boolean = true) => {
    const newDate = new Date(currentMonth);
    if (!isCurrentMonth) {
      if (day > 15) { // Previous month
        newDate.setMonth(newDate.getMonth() - 1);
      } else { // Next month
        newDate.setMonth(newDate.getMonth() + 1);
      }
    }
    newDate.setDate(day);
    setSelectedDate(newDate);
    const formattedDate = formatDateForDisplay(newDate);
    setNewExpense(prev => ({ ...prev, date: formattedDate }));
    // Clear any date error when a valid date is selected
    setExpenseErrors(prev => ({ ...prev, date: '' }));
    // Close the date picker after selecting a date
    setShowDatePicker(false);
  };
  
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDateForDisplay(selectedDate);
      setNewExpense(prev => ({ ...prev, date: formattedDate }));
      // Clear any date error when a valid date is selected
      setExpenseErrors(prev => ({ ...prev, date: '' }));
    }
  };
  
  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryId: string): Subcategory[] => {
    return subcategories.filter(sub => {
      // Handle both string and object types for category_id
      const subCategoryId = typeof sub.category_id === 'string' ? sub.category_id : sub.category_id?._id;
      return subCategoryId === categoryId;
    });
  };
  
  
  // Initial fetch of data
  useEffect(() => {
    refreshExpenseData();
    refreshData();
    fetchCategories();
    fetchSubcategories();
  }, [refreshExpenseData, refreshData, fetchCategories, fetchSubcategories]);

  const totalIncome = getTotalIncome();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Pressable 
          style={styles.headerActionButton} 
          hitSlop={8} 
          onPress={() => activeTab === 'income' ? openAddModal() : setExpenseModalVisible(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => handleTabChange('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
          onPress={() => handleTabChange('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>Expense</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'income' ? (
        // Income Tab Content
        <>
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
            {/* Display income items */}
            {(() => {
              return (
                <>
                  {incomeItems.map((item) => {
                    console.log('Rendering income item:', item);
                    return (
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
                        <View style={styles.amountContainer}>
                          <Text style={styles.amount}>₹ {item.amount.toLocaleString()}</Text>
                          <View style={styles.actions}>
                            <TouchableOpacity onPress={() => {
                              console.log('Edit income clicked for item:', item.id);
                              openEditModal(item);
                            }} style={styles.actionButton}>
                              <Feather name="edit" size={16} color="#8E8E93" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                              console.log('Delete income clicked for item:', item.id);
                              handleDelete(item.id);
                            }} style={styles.actionButton}>
                              <Feather name="trash-2" size={16} color="#FF3B30" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  
                  {/* Pagination Controls */}
                  {incomeItems.length > 0 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity 
                        style={[styles.paginationButton, paginationInfo.currentPage === 1 && styles.paginationButtonDisabled]}
                        onPress={handleLoadPreviousPage}
                        disabled={paginationInfo.currentPage === 1}
                      >
                        <Ionicons name="chevron-back" size={20} color={paginationInfo.currentPage === 1 ? "#C7C7CC" : GREEN} />
                      </TouchableOpacity>
                      
                      <Text style={styles.paginationText}>
                        Page {paginationInfo.currentPage} of {paginationInfo.totalPages || 1}
                      </Text>
                      
                      <TouchableOpacity 
                        style={[styles.paginationButton, paginationInfo.currentPage === paginationInfo.totalPages && styles.paginationButtonDisabled]}
                        onPress={handleLoadNextPage}
                        disabled={paginationInfo.currentPage === paginationInfo.totalPages}
                      >
                        <Ionicons name="chevron-forward" size={20} color={paginationInfo.currentPage === paginationInfo.totalPages ? "#C7C7CC" : GREEN} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              );
            })()}
            
            {incomeItems.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="cash-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyStateText}>No income entries yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap the + button to add your first income</Text>
              </View>
            )}
          </ScrollView>

          {/* Income Floating Action Button */}
          <TouchableOpacity style={styles.fab} onPress={openAddModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
                    
        </>
      ) : (
        // Expense Tab Content
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={styles.summaryAmount}>₹ {getTotalExpense().toLocaleString()}</Text>
            {isExpenseRefreshing && (
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
                refreshing={isExpenseRefreshing}
                onRefresh={refreshExpenseData}
                colors={[GREEN]}
                tintColor={GREEN}
              />
            }
          >
            {/* Display expense items */}
            {(() => {
              return (
                <>
                  {expenseItems.map((item) => {
                    console.log('Rendering expense item:', item);
                    return (
                      <View key={item.id} style={styles.row}>
                        <View style={styles.avatar}>
                          <Ionicons name="card-outline" size={16} color={GREEN} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{item.category}</Text>
                          <Text style={styles.date}>{item.date}</Text>
                          {item.description && (
                            <Text style={styles.description}>{item.description}</Text>
                          )}
                        </View>
                        <View style={styles.amountContainer}>
                          <Text style={styles.amount}>₹ {item.amount.toLocaleString()}</Text>
                          <View style={styles.actions}>
                            <TouchableOpacity onPress={() => {
                              console.log('Edit expense clicked for item:', item.id);
                              openEditExpenseModal(item);
                            }} style={styles.actionButton}>
                              <Feather name="edit" size={16} color="#8E8E93" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                              console.log('Delete expense clicked for item:', item.id);
                              handleDeleteExpense(item.id);
                            }} style={styles.actionButton}>
                              <Feather name="trash-2" size={16} color="#FF3B30" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  
                  {/* Pagination Controls */}
                  {expenseItems.length > 0 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity 
                        style={[styles.paginationButton, paginationInfo.currentPage === 1 && styles.paginationButtonDisabled]}
                        onPress={handleLoadPreviousPage}
                        disabled={paginationInfo.currentPage === 1}
                      >
                        <Ionicons name="chevron-back" size={20} color={paginationInfo.currentPage === 1 ? "#C7C7CC" : GREEN} />
                      </TouchableOpacity>
                      
                      <Text style={styles.paginationText}>
                        Page {paginationInfo.currentPage} of {paginationInfo.totalPages || 1}
                      </Text>
                      
                      <TouchableOpacity 
                        style={[styles.paginationButton, paginationInfo.currentPage === paginationInfo.totalPages && styles.paginationButtonDisabled]}
                        onPress={handleLoadNextPage}
                        disabled={paginationInfo.currentPage === paginationInfo.totalPages}
                      >
                        <Ionicons name="chevron-forward" size={20} color={paginationInfo.currentPage === paginationInfo.totalPages ? "#C7C7CC" : GREEN} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              );
            })()}
            
            {expenseItems.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyStateText}>No expense entries yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap the + button to add your first expense</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Expense Floating Action Button */}
          <TouchableOpacity style={styles.fab} onPress={() => setExpenseModalVisible(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Expense Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={expenseModalVisible}
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
              <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category <Text style={styles.requiredStar}>*</Text></Text>
                <Pressable 
                  style={[styles.formInput, styles.categoryInput, expenseErrors.category ? styles.inputError : null]}
                  onPress={() => {
                    if (!loadingCategories) {
                      setCategoryDropdownVisible(!categoryDropdownVisible);
                    }
                  }}
                  disabled={loadingCategories}
                >
                  <Text style={newExpense.categoryName ? styles.categoryText : styles.placeholderText}>
                    {newExpense.categoryName || (loadingCategories ? "Loading categories..." : "Select a category")}
                  </Text>
                  {loadingCategories ? (
                    <Ionicons name="refresh" size={16} color="#8E8E93" />
                  ) : (
                    <Ionicons name="chevron-down" size={16} color="#8E8E93" />
                  )}
                </Pressable>
                {expenseErrors.category ? <Text style={styles.errorText}>{expenseErrors.category}</Text> : null}
              </View>
              
              {/* Subcategory Selection */}
              {newExpense.categoryId && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Subcategory</Text>
                  <Pressable 
                    style={[styles.formInput, styles.categoryInput]}
                    onPress={() => setSubcategoryDropdownVisible(!subcategoryDropdownVisible)}
                  >
                    <Text style={newExpense.subcategoryName ? styles.categoryText : styles.placeholderText}>
                      {newExpense.subcategoryName || "Select a subcategory (optional)"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#8E8E93" />
                  </Pressable>
                </View>
              )}

              {/* Amount Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, expenseErrors.amount ? styles.inputError : null]}
                  value={newExpense.amount}
                  onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                  placeholder="Enter amount"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                />
                {expenseErrors.amount ? <Text style={styles.errorText}>{expenseErrors.amount}</Text> : null}
              </View>

              {/* Date Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.dateInputContainer}>
                  <Pressable
                    style={[styles.dateInput, expenseErrors.date ? styles.inputError : null]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={newExpense.date ? styles.dateText : styles.placeholderText}>
                      {newExpense.date || formatDateForDisplay(new Date())}
                    </Text>
                    <View style={styles.calendarIconContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#2E827C" />
                    </View>
                  </Pressable>
                  <TouchableOpacity style={styles.todayButton} onPress={setTodayDate}>
                    <Text style={styles.todayButtonText}>Today</Text>
                  </TouchableOpacity>
                </View>
                {expenseErrors.date ? <Text style={styles.errorText}>{expenseErrors.date}</Text> : null}
                {showDatePicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                  />
                )}
                {showDatePicker && Platform.OS === 'web' && (
                  <View style={styles.webCalendarContainer}>
                    <View style={styles.calendarHeader}>
<Text style={styles.calendarTitle}>{formatMonthYear(currentMonth)}</Text>
                      <View style={styles.calendarNavigation}>
                        <TouchableOpacity style={styles.calendarNavButton} onPress={goToPreviousMonth}>
                          <Ionicons name="chevron-back" size={18} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.calendarNavButton} onPress={goToNextMonth}>
                          <Ionicons name="chevron-forward" size={18} color="#333" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.weekdayHeader}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                        <Text key={index} style={styles.weekdayText}>{day}</Text>
                      ))}
                    </View>
                    
                    <View style={styles.calendarGrid}>
                      {generateCalendarDays().map((item, index) => {
                        const isSelected = selectedDate && 
                          selectedDate.getDate() === item.day && 
                          selectedDate.getMonth() === (item.isCurrentMonth ? 
                            currentMonth.getMonth() : 
                            (item.isPrevMonth ? 
                              currentMonth.getMonth() - 1 : 
                              currentMonth.getMonth() + 1));
                        
                        return (
                          <TouchableOpacity 
                            key={index} 
                            style={[
                              styles.dayButton, 
                              isSelected ? styles.selectedDayButton : null,
                              !item.isCurrentMonth ? styles.otherMonthDay : null
                            ]}
                            onPress={() => handleDaySelect(item.day, item.isCurrentMonth)}
                          >
                            <Text 
                              style={[
                                styles.dayText, 
                                isSelected ? styles.selectedDayText : null,
                                !item.isCurrentMonth ? styles.otherMonthDayText : null
                              ]}
                            >
                              {item.day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    
                    <View style={styles.calendarFooter}>
                      <TouchableOpacity 
                        style={styles.clearButton} 
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.clearButtonText}>Clear</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.todayButtonCalendar} 
                        onPress={() => {
                          setTodayDate();
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.todayButtonTextCalendar}>Today</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Description Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Add a note"
                  value={newExpense.description}
                  onChangeText={(text) => setNewExpense({...newExpense, description: text})}
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={async () => {
                  if (validateForm()) {
                    try {
                      // Convert the display date to API format for submission
                      const apiDate = newExpense.date ? convertDisplayDateToAPI(newExpense.date) : formatDateForAPI(new Date());
                      
                      console.log('Submitting expense:', {
                        category: newExpense.categoryName,
                        category_id: newExpense.categoryId,
                        subcat_id: newExpense.subcategoryId || undefined,
                        amount: parseFloat(newExpense.amount),
                        date: apiDate,
                        description: newExpense.description || undefined
                      });
                      
                      if (editingExpense) {
                        // Update existing expense
                        await updateExpense(editingExpense.id, {
                          category: newExpense.categoryName,
                          category_id: newExpense.categoryId,
                          subcat_id: newExpense.subcategoryId || undefined,
                          amount: parseFloat(newExpense.amount),
                          date: apiDate,
                          description: newExpense.description || undefined
                        });
                      } else {
                        // Add new expense
                        await addExpense({
                          category: newExpense.categoryName,
                          category_id: newExpense.categoryId,
                          subcat_id: newExpense.subcategoryId || undefined,
                          amount: parseFloat(newExpense.amount),
                          date: apiDate,
                          description: newExpense.description || undefined
                        });
                      }
                      
                      // Reset form and close modal
                      setEditingExpense(null);
                      setNewExpense({ 
                        categoryId: '', 
                        categoryName: '', 
                        subcategoryId: '', 
                        subcategoryName: '', 
                        amount: '', 
                        date: '', 
                        description: '' 
                      });
                      setCategoryDropdownVisible(false);
                      setSubcategoryDropdownVisible(false);
                      setExpenseModalVisible(false);
                      
                      // Reset to first page when adding new expense
                      if (!editingExpense) {
                        setCurrentPage(1);
                      }
                    } catch (error) {
                      console.error('Error submitting expense:', error);
                      // You could show an alert or toast here
                      Alert.alert(`Failed to ${editingExpense ? 'update' : 'add'} expense. Please check the console for details.`);
                    }
                  }
                }}
              >
                <Text style={styles.saveButtonText}>{editingExpense ? 'Update Expense' : 'Add Expense'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Income Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Income' : 'Add Income'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Source Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Source</Text>
                <TextInput
                  style={[styles.formInput, incomeErrors.source ? styles.inputError : null]}
                  value={formData.source}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, source: text }))}
                  placeholder="e.g., Salary, Freelance"
                  placeholderTextColor="#999999"
                />
                {incomeErrors.source ? <Text style={styles.errorText}>{incomeErrors.source}</Text> : null}
              </View>

              {/* Amount Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount</Text>
                <TextInput
                  style={[styles.formInput, incomeErrors.amount ? styles.inputError : null]}
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  placeholder="0.00"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                />
                {incomeErrors.amount ? <Text style={styles.errorText}>{incomeErrors.amount}</Text> : null}
              </View>

              {/* Date Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.formInput, styles.dateInput, incomeErrors.date ? styles.inputError : null]}
                    value={formData.date}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                    placeholder="Sep 15, 2024"
                    placeholderTextColor="#999999"
                  />
                  <TouchableOpacity style={styles.todayButton} onPress={setTodayDate}>
                    <Text style={styles.todayButtonText}>Today</Text>
                  </TouchableOpacity>
                </View>
                {incomeErrors.date ? <Text style={styles.errorText}>{incomeErrors.date}</Text> : null}
              </View>

              {/* Description Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Add notes about this income"
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={categoryDropdownVisible}
        onRequestClose={() => setCategoryDropdownVisible(false)}
      >
        <View style={styles.dropdownModalOverlay}>
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryDropdownVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              style={styles.dropdownModalList}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.dropdownModalItem}
                  onPress={() => {
                    setNewExpense({
                      ...newExpense, 
                      categoryId: item._id,
                      categoryName: item.name,
                      subcategoryId: '',
                      subcategoryName: ''
                    });
                    setCategoryDropdownVisible(false);
                    setSubcategoryDropdownVisible(false);
                    // Clear category error when a category is selected
                    setExpenseErrors(prev => ({ ...prev, category: '' }));
                  }}
                >
                  <Text style={styles.dropdownModalItemText}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.dropdownModalEmpty}>
                  {loadingCategories ? (
                    <>
                      <Ionicons name="refresh" size={32} color="#8E8E93" style={{ marginBottom: 12 }} />
                      <Text style={styles.dropdownModalEmptyText}>Loading categories...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="folder-outline" size={32} color="#C7C7CC" style={{ marginBottom: 12 }} />
                      <Text style={styles.dropdownModalEmptyText}>No categories available</Text>
                      <Text style={styles.dropdownModalEmptySubtext}>Please check your internet connection or try again</Text>
                    </>
                  )}
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Subcategory Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={subcategoryDropdownVisible}
        onRequestClose={() => setSubcategoryDropdownVisible(false)}
      >
        <View style={styles.dropdownModalOverlay}>
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Select Subcategory</Text>
              <TouchableOpacity onPress={() => setSubcategoryDropdownVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getSubcategoriesForCategory(newExpense.categoryId)}
              keyExtractor={(item) => item._id}
              style={styles.dropdownModalList}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.dropdownModalItem}
                  onPress={() => {
                    setNewExpense({
                      ...newExpense,
                      subcategoryId: item._id,
                      subcategoryName: item.name
                    });
                    setSubcategoryDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownModalItemText}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.dropdownModalEmpty}>
                  <Ionicons name="folder-outline" size={32} color="#C7C7CC" style={{ marginBottom: 12 }} />
                  <Text style={styles.dropdownModalEmptyText}>No subcategories available</Text>
                  <Text style={styles.dropdownModalEmptySubtext}>for {newExpense.categoryName}</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmVisible}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalHeader}>
              <Ionicons 
                name="warning" 
                size={48} 
                color="#FF3B30" 
                style={{ marginBottom: 16 }} 
              />
              <Text style={styles.confirmModalTitle}>
                Delete {itemToDelete?.type === 'income' ? 'Income' : 'Expense'}
              </Text>
              <Text style={styles.confirmModalMessage}>
                Are you sure you want to delete this {itemToDelete?.type} entry? This action cannot be undone.
              </Text>
            </View>
            
            <View style={styles.confirmModalActions}>
              <TouchableOpacity 
                style={styles.confirmModalCancelButton}
                onPress={cancelDelete}
              >
                <Text style={styles.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmModalDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmModalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  categoryInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'left',
  },
  placeholderText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
    flex: 1,
    textAlign: 'left',
  },
  dateText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  calendarIconContainer: {
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requiredStar: {
    color: '#FF3B30',
  },
  webCalendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarNavigation: {
    flexDirection: 'row',
  },
  calendarNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedDayButton: {
    backgroundColor: GREEN,
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  otherMonthDay: {
    opacity: 0.4,
  },
  otherMonthDayText: {
    color: '#8E8E93',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  clearButton: {
    padding: 8,
    marginRight: 12,
  },
  clearButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  todayButtonCalendar: {
    backgroundColor: GREEN,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  todayButtonTextCalendar: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  addIncomeButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 60, // Added bottom margin to prevent footer from being hidden
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginHorizontal: 12,
  },
  addIncomeButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: GREEN,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  refreshText: {
    fontSize: 12,
    color: GREEN,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: '#2E827C',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    minHeight: 48,
  },
  todayButton: {
    backgroundColor: '#34a853',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  saveButton: {
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: GREEN,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActionButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: GREEN,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: GREEN,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputField: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  nameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  nameText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  amountField: {
    borderColor: GREEN,
    borderWidth: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: GREEN,
    fontWeight: '700',
  },
  invoiceField: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  invoiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invoiceText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  // Modal dropdown styles
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dropdownModalList: {
    flex: 1,
  },
  dropdownModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dropdownModalItemText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },
  dropdownModalEmpty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  dropdownModalEmptyText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  dropdownModalEmptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  // Confirmation modal styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmModalCancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  confirmModalDeleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmModalDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


