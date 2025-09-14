import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { budgetApi, Budget, categoryApi, subcategoryApi, Category, Subcategory } from '../../services/api';
import {
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
  View
} from 'react-native';

import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useExpense } from '../../contexts/ExpenseContext';
import { useIncome } from '../../contexts/IncomeContext';
import { formatDateForDisplay, formatDateStringWithTime } from '../../utils/dateUtils';

type BudgetSummary = {
  daily: number;
  weekly: number;
  monthly: number;
};

type RootStackParamList = {
  index: undefined;
  stats: undefined;
  wallet: undefined;
  settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const bottomTabHeight = useBottomTabOverflow();
  const { getTotalIncome, getRecentIncome, refreshData: refreshIncome, isRefreshing: isRefreshingIncome } = useIncome();
  const { getTotalExpense, getRecentExpense, refreshData: refreshExpense, isRefreshing: isRefreshingExpense, addExpense } = useExpense();
  
  // State for budget data
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>({
    daily: 0,
    weekly: 0,
    monthly: 0
  });
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  
  // We only show expense data now
  const activeTab = 'expense';
  
  // Categories and subcategories from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // State for add expense modal
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [subcategoryDropdownVisible, setSubcategoryDropdownVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    categoryId: '',
    categoryName: '',
    subcategoryId: '',
    subcategoryName: '',
    amount: '',
    date: '',
    description: ''
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({
    category: '',
    amount: '',
    date: ''
  });

  // Fetch budget data from API
  const fetchBudgetSummary = useCallback(async () => {
    try {
      setLoadingBudgets(true);
      console.log('Fetching budget data...');
      const budgets = await budgetApi.getAll();
      console.log('Received budgets:', budgets);
      
      // Calculate summary by period
      const summary: BudgetSummary = {
        daily: 0,
        weekly: 0,
        monthly: 0
      };
      
      // Sum up budgets by name (period)
      budgets.forEach((budget: Budget) => {
        const budgetName = budget.name.toLowerCase();
        console.log(`Processing budget: ${budget.name} (${budgetName}) - Amount: ${budget.amount}`);
        if (budgetName === 'daily') summary.daily += budget.amount;
        if (budgetName === 'weekly') summary.weekly += budget.amount;
        if (budgetName === 'monthly') summary.monthly += budget.amount;
      });
      
      console.log('Calculated summary:', summary);
      setBudgetSummary(summary);
    } catch (error) {
      console.error('Error fetching budget summary:', error);
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  // Fetch categories and subcategories from API
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      console.log('Fetching categories...');
      const categoriesData = await categoryApi.getAll();
      console.log('Received categories:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async () => {
    try {
      console.log('Fetching subcategories...');
      const subcategoriesData = await subcategoryApi.getAll();
      console.log('Received subcategories:', subcategoriesData);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  }, []);

  // Get subcategories for a specific category
  const getSubcategoriesForCategory = useCallback((categoryId: string) => {
    return subcategories.filter(sub => {
      if (typeof sub.category_id === 'string') {
        return sub.category_id === categoryId;
      } else if (sub.category_id && typeof sub.category_id === 'object') {
        return sub.category_id._id === categoryId;
      }
      return false;
    });
  }, [subcategories]);

  // Get greeting based on time of day
  const getGreeting = useCallback(() => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return 'Good morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Good afternoon';
    } else if (currentHour >= 18 && currentHour < 22) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  }, []);

  const totalIncome = getTotalIncome();
  const recentIncome = getRecentIncome(3);
  const totalExpense = getTotalExpense();
  const recentExpense = getRecentExpense(3);
  
  // Determine if any refresh is happening
  const isRefreshing = isRefreshingIncome || isRefreshingExpense;
  
  // Combined refresh function
  const refreshData = useCallback(() => {
    refreshIncome();
    refreshExpense();
    fetchBudgetSummary();
    fetchCategories();
    fetchSubcategories();
  }, [refreshIncome, refreshExpense, fetchBudgetSummary, fetchCategories, fetchSubcategories]);

  // Auto-refresh when tab becomes active
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );
  
  // Initial fetch of data
  useEffect(() => {
    fetchBudgetSummary();
    fetchCategories();
    fetchSubcategories();
  }, [fetchBudgetSummary, fetchCategories, fetchSubcategories]);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {
      category: '',
      amount: '',
      date: ''
    };

    if (!newExpense.categoryName.trim() || !newExpense.categoryId.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!newExpense.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(newExpense.amount)) || parseFloat(newExpense.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!newExpense.date.trim()) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // State for calendar UI
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Set today's date
  const setTodayDate = () => {
    const today = new Date();
    setSelectedDate(today);
    const formattedDate = formatDateForDisplay(today);
    setNewExpense(prev => ({ ...prev, date: formattedDate }));
  };
  
  // Handle date change from date picker
  const onDateChange = (event: null, selectedDate: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDateForDisplay(selectedDate);
      setNewExpense(prev => ({ ...prev, date: formattedDate }));
      // Clear any date error when a valid date is selected
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };
  
  // Calendar navigation
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentMonth(previousMonth);
  };
  
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // Calendar day selection
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
    setErrors(prev => ({ ...prev, date: '' }));
    // Close the date picker after selecting a date
    setShowDatePicker(false);
  };
  
  // Generate calendar days
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
  
  // Format month and year for display
  const formatMonthYear = (date: Date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#2E827C']}
            tintColor="#2E827C"
          />
        }
      >
        <View style={styles.headerBg}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingLabel}>{getGreeting()}</Text>
              <Text style={styles.greetingName}>Ragu Rithvik</Text>
            </View>
            <View style={styles.bellWrapper}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.badge} />
            </View>
          </View>
          
          {/* Tab selector removed as requested */}

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Total Balance</Text>
              <Ionicons name="ellipsis-horizontal" size={22} color="#DAF0EC" />
            </View>
            <Text style={styles.balanceText}>₹ {(totalIncome - totalExpense).toLocaleString()}</Text>

            <View style={styles.incomeExpenseRow}>
              <View style={styles.incomeCol}>
                <View style={[styles.ieIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}> 
                  <Ionicons name="cash-outline" size={16} color="#DAF0EC" />
                </View>
                <Text style={styles.ieLabel}>Income</Text>
                <Text style={styles.ieValue}>₹ {totalIncome.toLocaleString()}</Text>
              </View>
              <View style={styles.expenseCol}>
                <View style={[styles.ieIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}> 
                  <Ionicons name="pricetag-outline" size={16} color="#DAF0EC" />
                </View>
                <Text style={styles.ieLabel}>Expenses</Text>
                <Text style={styles.ieValue}>₹ {totalExpense.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Budget Summary */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Budget</Text>
        </View>
        {loadingBudgets ? (
          <View style={styles.loadingContainer}>
            <View style={{ width: 24, height: 24 }}>
              <Ionicons name="sync" size={24} color="#0000ff" />
            </View>
            <Text style={styles.loadingText}>Loading budgets...</Text>
          </View>
        ) : (
          <View style={styles.budgetRow}>
            <View style={[styles.budgetCard, { backgroundColor: '#F3FBF9' }]}>
              <Text style={styles.budgetLabel}>Daily</Text>
              <Text style={styles.budgetValue}>₹ {budgetSummary.daily?.toLocaleString() || '0'}</Text>
            </View>
            <View style={[styles.budgetCard, { backgroundColor: '#F9F6FF' }]}>
              <Text style={styles.budgetLabel}>Weekly</Text>
              <Text style={styles.budgetValue}>₹ {budgetSummary.weekly?.toLocaleString() || '0'}</Text>
            </View>
            <View style={[styles.budgetCard, { backgroundColor: '#FFF7F3' }]}>
              <Text style={styles.budgetLabel}>Monthly</Text>
              <Text style={styles.budgetValue}>₹ {budgetSummary.monthly?.toLocaleString() || '0'}</Text>
            </View>
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
        </View>
        <View>
          {/* Only showing expense items */}
          {recentExpense.map((exp) => (
            <View key={exp.id} style={styles.incomeRow}>
              <View style={styles.expenseAvatar}>
                <Ionicons name="pricetag-outline" size={16} color="#FF3B30" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.incomeName}>{exp.category}</Text>
                <Text style={styles.incomeDate}>{formatDateStringWithTime(exp.date)}</Text>
                {exp.description && (
                  <Text style={styles.incomeDescription}>{exp.description}</Text>
                )}
              </View>
              <Text style={styles.expenseAmount}>- ₹ {exp.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Footer UI with add button */}
      <View style={[styles.footer, { height: bottomTabHeight + 60 }]}>
        <View style={styles.footerContent}>
          <Pressable style={styles.footerIcon} onPress={() => navigation.navigate('index')}>
             <Ionicons name="home" size={24} color="#2E827C" />
           </Pressable>
           <Pressable style={styles.footerIcon} onPress={() => navigation.navigate('stats')}>
             <Ionicons name="stats-chart-outline" size={24} color="#B0B0B0" />
           </Pressable>
           <View style={{width: 60}} />
           <Pressable style={styles.footerIcon} onPress={() => navigation.navigate('wallet')}>
             <Ionicons name="wallet-outline" size={24} color="#B0B0B0" />
           </Pressable>
           <Pressable style={styles.footerIcon} onPress={() => navigation.navigate('settings')}>
             <Ionicons name="settings-outline" size={24} color="#B0B0B0" />
           </Pressable>
        </View>
        <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={36} color="#fff" />
        </Pressable>
      </View>
      
      {/* Add Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category <Text style={styles.requiredStar}>*</Text></Text>
              <Pressable 
                style={[styles.input, styles.categoryInput, errors.category ? styles.inputError : null]}
                onPress={() => setCategoryDropdownVisible(!categoryDropdownVisible)}
              >
                <Text style={newExpense.categoryName ? styles.categoryText : styles.placeholderText}>
                  {newExpense.categoryName || "Select a category"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </Pressable>
              {categoryDropdownVisible && (
                <View style={styles.dropdownContainer}>
                  {loadingCategories ? (
                    <View style={styles.dropdownLoadingContainer}>
                      <Text style={styles.dropdownLoadingText}>Loading categories...</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={categories}
                      keyExtractor={(item) => item._id}
                      style={styles.dropdown}
                      nestedScrollEnabled
                      renderItem={({item}) => (
                        <TouchableOpacity 
                          style={styles.dropdownItem}
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
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{item.name}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </View>
              )}
              {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
            </View>
            
            {/* Subcategory Selection */}
            {newExpense.categoryId && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subcategory</Text>
                <Pressable 
                  style={[styles.input, styles.categoryInput]}
                  onPress={() => setSubcategoryDropdownVisible(!subcategoryDropdownVisible)}
                >
                  <Text style={newExpense.subcategoryName ? styles.categoryText : styles.placeholderText}>
                    {newExpense.subcategoryName || "Select a subcategory (optional)"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#8E8E93" />
                </Pressable>
                {subcategoryDropdownVisible && (
                  <View style={styles.dropdownContainer}>
                    <FlatList
                      data={getSubcategoriesForCategory(newExpense.categoryId)}
                      keyExtractor={(item) => item._id}
                      style={styles.dropdown}
                      nestedScrollEnabled
                      renderItem={({item}) => (
                        <TouchableOpacity 
                          style={styles.dropdownItem}
                          onPress={() => {
                            setNewExpense({
                              ...newExpense,
                              subcategoryId: item._id,
                              subcategoryName: item.name
                            });
                            setSubcategoryDropdownVisible(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{item.name}</Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <View style={styles.emptyDropdown}>
                          <Text style={styles.emptyDropdownText}>No subcategories available</Text>
                        </View>
                      }
                    />
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.amountInput, errors.amount ? styles.inputError : null]}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={newExpense.amount}
                onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                placeholderTextColor="#999"
              />
              {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.dateInputContainer}>
                <Pressable
                  style={[styles.input, styles.dateInput, errors.date ? styles.inputError : null]}
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
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => onDateChange(null, date as Date)}
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
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Add a note"
                value={newExpense.description}
                onChangeText={(text) => setNewExpense({...newExpense, description: text})}
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={async () => {
                if (validateForm()) {
                  try {
                    console.log('Submitting expense:', {
                      category: newExpense.categoryName,
                      category_id: newExpense.categoryId,
                      subcat_id: newExpense.subcategoryId || undefined,
                      amount: parseFloat(newExpense.amount),
                      date: newExpense.date,
                      description: newExpense.description || undefined
                    });
                    
                    // Add the expense with current date-time
                    await addExpense({
                      category: newExpense.categoryName,
                      category_id: newExpense.categoryId,
                      subcat_id: newExpense.subcategoryId || undefined,
                      amount: parseFloat(newExpense.amount),
                      date: new Date().toISOString(), // Use current date-time in ISO format
                      description: newExpense.description || undefined
                    });
                    
                    // Refresh data to show the new expense
                    refreshData();
                   
                    // Reset form and close modal
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
                    setModalVisible(false);
                  } catch (error) {
                    console.error('Error submitting expense:', error);
                    // You could show an alert or toast here
                    alert('Failed to add expense. Please check the console for details.');
                  }
                }
              }}
            >
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
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
  dateText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
    flex: 1,
    textAlign: 'left',
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
  calendarIconContainer: {
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCalendarContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  calendarNavigation: {
    flexDirection: 'row',
    gap: 8,
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
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  selectedDayButton: {
    backgroundColor: '#34a853',
  },
  otherMonthDay: {
    opacity: 0.6,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  otherMonthDayText: {
    color: '#999',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  todayButtonCalendar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#34a853',
  },
  todayButtonTextCalendar: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#2E827C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  amountInput: {
    fontWeight: '500',
  },
  categoryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2E827C',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
  },
  categoryText: {
    color: '#333',
    fontSize: 16,
  },
  // placeholderText: {
  //   color: '#999',
  //   fontSize: 16,
  // },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownLoadingContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  dropdownLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyDropdown: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  headerBg: {
    backgroundColor: '#34a853',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  // Tab styles removed as they're no longer needed
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 2,
    fontFamily: 'Rubik-Regular',
  },
  greetingName: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
  },
  bellWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFA24C',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  card: {
    backgroundColor: '#2d9048',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#e8f5e9',
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
  },
  balanceText: {
    color: '#fff',
    fontSize: 36,
    fontFamily: 'Rubik-Bold',
    marginBottom: 12,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  incomeCol: {
    width: '48%',
  },
  expenseCol: {
    width: '48%',
    alignItems: 'flex-end',
  },
  ieIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ieLabel: {
    color: '#e8f5e9',
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'Rubik-Regular',
  },
  ieValue: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
  },
  sectionHeaderRow: {
    marginTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#1A1A1A',
  },
  sectionLink: {
    color: '#8E8E93',
    fontFamily: 'Rubik-Bold',
  },
  budgetRow: {
    marginTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  budgetCard: {
    width: '31%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  budgetLabel: {
    color: '#6B6E70',
    fontSize: 12,
    marginBottom: 6,
    fontFamily: 'Rubik-Regular',
  },
  budgetValue: {
    color: '#1A1A1A',
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomColor: '#34a853',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  incomeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52,168,83,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  incomeName: {
    fontSize: 14,
    color: '#222',
    fontFamily: 'Rubik-Bold',
  },
  incomeDate: {
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'Rubik-Regular',
  },
  incomeDescription: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
    fontFamily: 'Rubik-Regular',
  },
  incomeAmount: {
    fontSize: 14,
    color: '#34a853',
    fontFamily: 'Rubik-Bold',
  },
  expenseAmount: {
    fontSize: 14,
    color: '#FF3B30',
    fontFamily: 'Rubik-Bold',
  },
  expenseAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,59,48,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
    elevation: 15,
    height: 70,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  footerIcon: {
    padding: 10,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34a853',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
    borderWidth: 4,
    borderColor: '#fff',
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    zIndex: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Rubik-Regular',
  },
  requiredStar: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  baseInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
  },
  addButton: {
    backgroundColor: '#2E827C',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
  },

});
