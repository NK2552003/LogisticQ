import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { 
  Search, 
  Package, 
  MessageSquare, 
  CreditCard, 
  MapPin,
  Calendar,
  User,
  Phone,
  Filter,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const { width } = Dimensions.get('window');

interface HistoryItem {
  id: string;
  type: 'order' | 'message' | 'payment' | 'tracking';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  metadata?: any;
  is_deleted?: boolean;
}

interface HistoryFilter {
  type: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

const History = () => {
  const { user } = useUser();
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>({
    type: 'all',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    if (!user?.id) return;

    try {
      const response = await fetchAPI(`/(api)/history?clerkUserId=${user.id}`);
      
      if (response.error) {
        // Use mock data if API fails
        const mockHistory: HistoryItem[] = [
          {
            id: '1',
            type: 'order',
            title: 'Package Delivered',
            description: 'Order #ORD-001 delivered successfully to New York',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'delivered',
            metadata: { orderId: 'ORD-001', amount: 150.00 }
          },
          {
            id: '2',
            type: 'message',
            title: 'New Message',
            description: 'Message from driver about delivery delay',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: 'read',
            metadata: { sender: 'John Driver', phone: '+1234567890' }
          },
          {
            id: '3',
            type: 'payment',
            title: 'Payment Received',
            description: 'Payment of $150.00 received for Order #ORD-001',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            status: 'completed',
            metadata: { amount: 150.00, method: 'Credit Card' }
          },
          {
            id: '4',
            type: 'tracking',
            title: 'Location Update',
            description: 'Package location updated - In Transit',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            status: 'in_transit',
            metadata: { location: 'Philadelphia, PA' }
          },
          {
            id: '5',
            type: 'order',
            title: 'New Order Created',
            description: 'Order #ORD-002 created for pickup in Boston',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            status: 'pending',
            metadata: { orderId: 'ORD-002', amount: 225.00 }
          }
        ];
        setHistoryData(mockHistory);
        return;
      }

      const { history } = response;
      setHistoryData(history || []);
    } catch (error) {
      console.error('History fetch error:', error);
      Alert.alert('Error', 'Failed to load history');
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      await fetchHistory();
      setLoading(false);
    };

    loadHistory();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const filterHistory = () => {
    let filtered = historyData.filter(item => !item.is_deleted);

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter.type !== 'all') {
      filtered = filtered.filter(item => item.type === selectedFilter.type);
    }

    if (selectedFilter.status !== 'all') {
      filtered = filtered.filter(item => item.status === selectedFilter.status);
    }

    if (selectedFilter.dateFrom) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) >= new Date(selectedFilter.dateFrom)
      );
    }

    if (selectedFilter.dateTo) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) <= new Date(selectedFilter.dateTo)
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package size={24} color="#007AFF" />;
      case 'message': return <MessageSquare size={24} color="#34C759" />;
      case 'payment': return <CreditCard size={24} color="#FF9500" />;
      case 'tracking': return <MapPin size={24} color="#AF52DE" />;
      default: return <AlertCircle size={24} color="#8E8E93" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
      case 'paid':
        return <CheckCircle size={20} color="#34C759" />;
      case 'pending':
      case 'in_transit':
        return <Clock size={20} color="#FF9500" />;
      case 'cancelled':
      case 'failed':
        return <XCircle size={20} color="#FF3B30" />;
      default:
        return <AlertCircle size={20} color="#8E8E93" />;
    }
  };

  const handleViewDetails = (item: HistoryItem) => {
    setSelectedItem(item);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  const exportHistory = async () => {
    Alert.alert(
      'Export History',
      'Choose export format',
      [
        { text: 'CSV', onPress: () => console.log('Export CSV') },
        { text: 'PDF', onPress: () => console.log('Export PDF') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredHistory = filterHistory();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportHistory}
          >
            <Download size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search history..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
      </View>

      {/* Filter Tags */}
      {(selectedFilter.type !== 'all' || selectedFilter.status !== 'all') && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterTags}
        >
          {selectedFilter.type !== 'all' && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>{selectedFilter.type}</Text>
              <TouchableOpacity
                onPress={() => setSelectedFilter(prev => ({ ...prev, type: 'all' }))}
              >
                <XCircle size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
          {selectedFilter.status !== 'all' && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>{selectedFilter.status}</Text>
              <TouchableOpacity
                onPress={() => setSelectedFilter(prev => ({ ...prev, status: 'all' }))}
              >
                <XCircle size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* History List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => handleViewDetails(item)}
            >
              <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                  {getTypeIcon(item.type)}
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <View style={styles.itemMeta}>
                    <Calendar size={14} color="#8E8E93" />
                    <Text style={styles.itemDate}>{formatDate(item.timestamp)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.itemRight}>
                {item.status && getStatusIcon(item.status)}
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => handleViewDetails(item)}
                >
                  <Eye size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <AlertCircle size={60} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No History Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedFilter.type !== 'all' || selectedFilter.status !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your activity history will appear here'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter History</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Type</Text>
              {['all', 'order', 'message', 'payment', 'tracking'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    selectedFilter.type === type && styles.filterOptionSelected
                  ]}
                  onPress={() => setSelectedFilter(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilter.type === type && styles.filterOptionTextSelected
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  {selectedFilter.type === type && (
                    <CheckCircle size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              {['all', 'pending', 'completed', 'delivered', 'cancelled', 'in_transit'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    selectedFilter.status === status && styles.filterOptionSelected
                  ]}
                  onPress={() => setSelectedFilter(prev => ({ ...prev, status }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilter.status === status && styles.filterOptionTextSelected
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </Text>
                  {selectedFilter.status === status && (
                    <CheckCircle size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Details</Text>
            <View style={{ width: 60 }} />
          </View>
          
          {selectedItem && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsHeader}>
                  {getTypeIcon(selectedItem.type)}
                  <Text style={styles.detailsTitle}>{selectedItem.title}</Text>
                </View>
                
                <Text style={styles.detailsDescription}>{selectedItem.description}</Text>
                
                <View style={styles.detailsInfo}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Type:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
                    </Text>
                  </View>
                  
                  {selectedItem.status && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Status:</Text>
                      <View style={styles.statusContainer}>
                        {getStatusIcon(selectedItem.status)}
                        <Text style={styles.detailsValue}>
                          {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Date:</Text>
                    <Text style={styles.detailsValue}>
                      {new Date(selectedItem.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  
                  {selectedItem.metadata && (
                    <View style={styles.metadataContainer}>
                      <Text style={styles.metadataTitle}>Additional Information:</Text>
                      {Object.entries(selectedItem.metadata).map(([key, value]) => (
                        <View key={key} style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                          </Text>
                          <Text style={styles.detailsValue}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  filterButton: {
    padding: 8,
  },
  exportButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  filterTags: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterTagText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  itemRight: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalDone: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  filterOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  detailsDescription: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 24,
  },
  detailsInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  metadataContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
});

export default History;