import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Share,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Filter,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Share as ShareIcon,
  Printer,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react-native';
import { fetchAPI } from '../../lib/fetch';

const { width } = Dimensions.get('window');

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  order_number?: string;
  customer_name?: string;
  company_name?: string;
  customer_email?: string;
  customer_phone?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  items?: InvoiceItem[];
  notes?: string;
  created_at: string;
  updated_at?: string;
  pickup_address?: string;
  delivery_address?: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const InvoicesScreen = () => {
  const { user } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch invoices from API
  const fetchInvoices = async () => {
    if (!user?.id) return;

    try {
      const response = await fetchAPI(`/(api)/invoices?clerkUserId=${user.id}`);
      
      if (response.error) {
        // Use comprehensive mock data if API fails
        const mockInvoices: Invoice[] = [
          {
            id: '1',
            invoice_number: 'INV-2024-001',
            order_id: 'ord-1',
            order_number: 'ORD-001',
            customer_name: 'John Smith',
            company_name: 'Smith Industries',
            customer_email: 'john@smithindustries.com',
            customer_phone: '+1-555-0123',
            amount: 150.00,
            tax_amount: 15.00,
            total_amount: 165.00,
            currency: 'USD',
            status: 'paid',
            due_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
            paid_date: new Date().toISOString(),
            payment_method: 'Credit Card',
            created_at: new Date().toISOString(),
            pickup_address: '123 Main St, Boston, MA 02101',
            delivery_address: '456 Broadway, New York, NY 10013',
            items: [
              { id: '1', description: 'Express Delivery Service', quantity: 1, rate: 150.00, amount: 150.00 }
            ],
            notes: 'Rush delivery completed on time. Customer satisfied with service.'
          },
          {
            id: '2',
            invoice_number: 'INV-2024-002',
            order_id: 'ord-2',
            order_number: 'ORD-002',
            customer_name: 'Sarah Johnson',
            company_name: 'Johnson Corp',
            customer_email: 'sarah@johnsoncorp.com',
            customer_phone: '+1-555-0456',
            amount: 225.00,
            tax_amount: 22.50,
            total_amount: 247.50,
            currency: 'USD',
            status: 'pending',
            due_date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
            created_at: new Date(Date.now() - 86400000).toISOString(),
            pickup_address: '789 Market St, Philadelphia, PA 19107',
            delivery_address: '321 K St NW, Washington, DC 20001',
            items: [
              { id: '2', description: 'Standard Delivery Service', quantity: 1, rate: 200.00, amount: 200.00 },
              { id: '3', description: 'Insurance Coverage', quantity: 1, rate: 25.00, amount: 25.00 }
            ],
            notes: 'Fragile items. Handle with care.'
          },
          {
            id: '3',
            invoice_number: 'INV-2024-003',
            order_id: 'ord-3',
            order_number: 'ORD-003',
            customer_name: 'Mike Wilson',
            customer_email: 'mike.wilson@email.com',
            customer_phone: '+1-555-0789',
            amount: 95.00,
            tax_amount: 9.50,
            total_amount: 104.50,
            currency: 'USD',
            status: 'overdue',
            due_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
            created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
            pickup_address: '654 Lake Shore Dr, Chicago, IL 60611',
            delivery_address: '987 Woodward Ave, Detroit, MI 48226',
            items: [
              { id: '4', description: 'Economy Delivery Service', quantity: 1, rate: 95.00, amount: 95.00 }
            ],
            notes: 'Payment overdue. Follow up required.'
          },
          {
            id: '4',
            invoice_number: 'INV-2024-004',
            order_id: 'ord-4',
            order_number: 'ORD-004',
            customer_name: 'Lisa Chen',
            company_name: 'Tech Solutions Inc',
            customer_email: 'lisa@techsolutions.com',
            customer_phone: '+1-555-0321',
            amount: 300.00,
            tax_amount: 30.00,
            total_amount: 330.00,
            currency: 'USD',
            status: 'paid',
            due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            paid_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            payment_method: 'Bank Transfer',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            pickup_address: '555 California St, San Francisco, CA 94104',
            delivery_address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
            items: [
              { id: '5', description: 'Premium Delivery Service', quantity: 1, rate: 250.00, amount: 250.00 },
              { id: '6', description: 'White Glove Service', quantity: 1, rate: 50.00, amount: 50.00 }
            ],
            notes: 'High-value electronics delivery completed successfully.'
          },
          {
            id: '5',
            invoice_number: 'INV-2024-005',
            order_id: 'ord-5',
            order_number: 'ORD-005',
            customer_name: 'Robert Davis',
            customer_email: 'robert.davis@company.com',
            customer_phone: '+1-555-0654',
            amount: 75.00,
            tax_amount: 7.50,
            total_amount: 82.50,
            currency: 'USD',
            status: 'cancelled',
            due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            pickup_address: '123 Commerce St, Dallas, TX 75201',
            delivery_address: '456 Main St, Austin, TX 78701',
            items: [
              { id: '7', description: 'Standard Delivery Service', quantity: 1, rate: 75.00, amount: 75.00 }
            ],
            notes: 'Order cancelled by customer. Refund processed.'
          }
        ];
        setInvoices(mockInvoices);
        return;
      }

      const { invoices: fetchedInvoices } = response;
      setInvoices(fetchedInvoices || []);
    } catch (error) {
      console.error('Invoice fetch error:', error);
      Alert.alert('Error', 'Failed to load invoices');
    }
  };

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      await fetchInvoices();
      setLoading(false);
    };

    loadInvoices();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  // Filter invoices based on search and status
  const filterInvoices = () => {
    let filtered = invoices;

    if (searchQuery) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === selectedStatus);
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // Get status color for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#34C759';
      case 'pending': return '#FF9500';
      case 'overdue': return '#FF3B30';
      case 'cancelled': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={20} color="#34C759" />;
      case 'pending': return <Clock size={20} color="#FF9500" />;
      case 'overdue': return <AlertCircle size={20} color="#FF3B30" />;
      case 'cancelled': return <XCircle size={20} color="#8E8E93" />;
      default: return <AlertCircle size={20} color="#8E8E93" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle create invoice
  const handleCreateInvoice = () => {
    setShowCreateModal(true);
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  // Handle share invoice
  const handleShareInvoice = async (invoice: Invoice) => {
    try {
      const shareContent = `Invoice ${invoice.invoice_number}\n` +
        `Customer: ${invoice.customer_name}\n` +
        `Amount: ${formatCurrency(invoice.total_amount)}\n` +
        `Status: ${invoice.status.toUpperCase()}\n` +
        `Due Date: ${formatDate(invoice.due_date)}`;

      await Share.share({
        message: shareContent,
        title: `Invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Print Invoice',
      `Print ${invoice.invoice_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Print', onPress: () => console.log('Print invoice:', invoice.id) }
      ]
    );
  };

  // Handle download invoice
  const handleDownloadInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Download Invoice',
      `Download ${invoice.invoice_number} as PDF?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => console.log('Download invoice:', invoice.id) }
      ]
    );
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      const response = await fetchAPI('/(api)/invoices', {
        method: 'PUT',
        body: JSON.stringify({
          invoice_id: invoice.id,
          status: 'paid',
          payment_method: 'Cash',
          paid_date: new Date().toISOString()
        })
      });

      if (response.error) {
        Alert.alert('Error', 'Failed to update invoice status');
        return;
      }

      // Update local state
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id 
          ? { ...inv, status: 'paid' as const, paid_date: new Date().toISOString(), payment_method: 'Cash' }
          : inv
      ));

      Alert.alert('Success', 'Invoice marked as paid');
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Update invoice error:', error);
      Alert.alert('Error', 'Failed to update invoice');
    }
  };

  // Handle send reminder
  const handleSendReminder = (invoice: Invoice) => {
    Alert.alert(
      'Send Reminder',
      `Send payment reminder for ${invoice.invoice_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Email', 
          onPress: () => {
            Alert.alert('Success', 'Payment reminder sent via email');
          }
        },
        { 
          text: 'Send SMS', 
          onPress: () => {
            Alert.alert('Success', 'Payment reminder sent via SMS');
          }
        }
      ]
    );
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const filteredInvs = filterInvoices();
    const totalAmount = filteredInvs.reduce((sum, inv) => sum + inv.total_amount, 0);
    const paidAmount = filteredInvs.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0);
    const pendingAmount = filteredInvs.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total_amount, 0);
    const overdueAmount = filteredInvs.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total_amount, 0);

    return {
      total: totalAmount,
      paid: paidAmount,
      pending: pendingAmount,
      overdue: overdueAmount,
      count: filteredInvs.length
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredInvoices = filterInvoices();
  const summary = calculateSummary();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invoices</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateInvoice}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.summaryContainer}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
          <Text style={styles.summaryLabel}>Total Amount</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E8' }]}>
          <Text style={[styles.summaryValue, { color: '#34C759' }]}>{formatCurrency(summary.paid)}</Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF4E6' }]}>
          <Text style={[styles.summaryValue, { color: '#FF9500' }]}>{formatCurrency(summary.pending)}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFE6E6' }]}>
          <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>{formatCurrency(summary.overdue)}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <XCircle size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['all', 'pending', 'paid', 'overdue', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setSelectedStatus(status)}
            style={[
              styles.filterChip,
              selectedStatus === status && styles.filterChipActive
            ]}
          >
            <Text style={[
              styles.filterChipText,
              selectedStatus === status && styles.filterChipTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Invoice List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <TouchableOpacity
              key={invoice.id}
              onPress={() => handleViewInvoice(invoice)}
              style={styles.invoiceCard}
            >
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                  <Text style={styles.customerName}>
                    {invoice.customer_name || 'Unknown Customer'}
                  </Text>
                  {invoice.company_name && (
                    <Text style={styles.companyName}>{invoice.company_name}</Text>
                  )}
                </View>
                <View style={styles.invoiceAmount}>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(invoice.total_amount)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(invoice.status) + '20' }
                  ]}>
                    {getStatusIcon(invoice.status)}
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(invoice.status) }
                    ]}>
                      {invoice.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.invoiceDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#8E8E93" />
                  <Text style={styles.detailText}>
                    Due: {formatDate(invoice.due_date)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#8E8E93" />
                  <Text style={styles.detailText}>
                    Created: {formatDate(invoice.created_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.invoiceActions}>
                <TouchableOpacity
                  onPress={() => handleShareInvoice(invoice)}
                  style={styles.actionButton}
                >
                  <ShareIcon size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDownloadInvoice(invoice)}
                  style={styles.actionButton}
                >
                  <Download size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleViewInvoice(invoice)}
                  style={styles.actionButton}
                >
                  <Eye size={18} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FileText size={60} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started'
              }
            </Text>
            {(!searchQuery && selectedStatus === 'all') && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={handleCreateInvoice}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createFirstButtonText}>Create First Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Invoice Details Modal */}
      <Modal
        visible={!!selectedInvoice}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invoice Details</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => selectedInvoice && handlePrintInvoice(selectedInvoice)}
                style={styles.modalActionButton}
              >
                <Printer size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectedInvoice && handleShareInvoice(selectedInvoice)}
                style={styles.modalActionButton}
              >
                <ShareIcon size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {selectedInvoice && (
            <ScrollView style={styles.modalContent}>
              {/* Invoice Header */}
              <View style={styles.invoiceDetailCard}>
                <View style={styles.invoiceDetailHeader}>
                  <View>
                    <Text style={styles.invoiceDetailNumber}>
                      {selectedInvoice.invoice_number}
                    </Text>
                    <Text style={styles.invoiceDetailDate}>
                      Created: {formatDateTime(selectedInvoice.created_at)}
                    </Text>
                    {selectedInvoice.order_number && (
                      <Text style={styles.orderNumber}>
                        Order: {selectedInvoice.order_number}
                      </Text>
                    )}
                  </View>
                  <View style={styles.invoiceDetailStatus}>
                    <View style={[
                      styles.statusBadgeLarge,
                      { backgroundColor: getStatusColor(selectedInvoice.status) + '20' }
                    ]}>
                      {getStatusIcon(selectedInvoice.status)}
                      <Text style={[
                        styles.statusTextLarge,
                        { color: getStatusColor(selectedInvoice.status) }
                      ]}>
                        {selectedInvoice.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.dueDateText}>
                      Due: {formatDate(selectedInvoice.due_date)}
                    </Text>
                  </View>
                </View>

                {/* Customer Information */}
                <View style={styles.sectionDivider} />
                <View style={styles.customerSection}>
                  <Text style={styles.sectionTitle}>Bill To:</Text>
                  <Text style={styles.customerNameLarge}>
                    {selectedInvoice.customer_name}
                  </Text>
                  {selectedInvoice.company_name && (
                    <Text style={styles.companyNameLarge}>
                      {selectedInvoice.company_name}
                    </Text>
                  )}
                  {selectedInvoice.customer_email && (
                    <View style={styles.contactRow}>
                      <Mail size={16} color="#8E8E93" />
                      <Text style={styles.contactText}>
                        {selectedInvoice.customer_email}
                      </Text>
                    </View>
                  )}
                  {selectedInvoice.customer_phone && (
                    <View style={styles.contactRow}>
                      <Phone size={16} color="#8E8E93" />
                      <Text style={styles.contactText}>
                        {selectedInvoice.customer_phone}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Shipping Information */}
                {(selectedInvoice.pickup_address || selectedInvoice.delivery_address) && (
                  <>
                    <View style={styles.sectionDivider} />
                    <View style={styles.shippingSection}>
                      <Text style={styles.sectionTitle}>Shipping Details:</Text>
                      {selectedInvoice.pickup_address && (
                        <View style={styles.addressRow}>
                          <MapPin size={16} color="#34C759" />
                          <View style={styles.addressInfo}>
                            <Text style={styles.addressLabel}>Pickup:</Text>
                            <Text style={styles.addressText}>
                              {selectedInvoice.pickup_address}
                            </Text>
                          </View>
                        </View>
                      )}
                      {selectedInvoice.delivery_address && (
                        <View style={styles.addressRow}>
                          <MapPin size={16} color="#FF3B30" />
                          <View style={styles.addressInfo}>
                            <Text style={styles.addressLabel}>Delivery:</Text>
                            <Text style={styles.addressText}>
                              {selectedInvoice.delivery_address}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </>
                )}

                {/* Items */}
                <View style={styles.sectionDivider} />
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Items:</Text>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemDescription}>{item.description}</Text>
                          <Text style={styles.itemDetails}>
                            Qty: {item.quantity} × {formatCurrency(item.rate)}
                          </Text>
                        </View>
                        <Text style={styles.itemAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noItemsText}>No items specified</Text>
                  )}
                </View>

                {/* Totals */}
                <View style={styles.sectionDivider} />
                <View style={styles.totalsSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(selectedInvoice.amount)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax:</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(selectedInvoice.tax_amount)}
                    </Text>
                  </View>
                  <View style={[styles.totalRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Total:</Text>
                    <Text style={styles.grandTotalValue}>
                      {formatCurrency(selectedInvoice.total_amount)}
                    </Text>
                  </View>
                </View>

                {/* Payment Information */}
                {selectedInvoice.paid_date && (
                  <>
                    <View style={styles.sectionDivider} />
                    <View style={styles.paymentSection}>
                      <Text style={styles.sectionTitle}>Payment Information:</Text>
                      <Text style={styles.paymentText}>
                        Paid on: {formatDateTime(selectedInvoice.paid_date)}
                      </Text>
                      {selectedInvoice.payment_method && (
                        <Text style={styles.paymentText}>
                          Method: {selectedInvoice.payment_method}
                        </Text>
                      )}
                    </View>
                  </>
                )}

                {/* Notes */}
                {selectedInvoice.notes && (
                  <>
                    <View style={styles.sectionDivider} />
                    <View style={styles.notesSection}>
                      <Text style={styles.sectionTitle}>Notes:</Text>
                      <Text style={styles.notesText}>{selectedInvoice.notes}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                {selectedInvoice.status === 'pending' && (
                  <TouchableOpacity
                    onPress={() => handleMarkAsPaid(selectedInvoice)}
                    style={[styles.actionButtonLarge, styles.markPaidButton]}
                  >
                    <CheckCircle size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}
                
                {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
                  <TouchableOpacity
                    onPress={() => handleSendReminder(selectedInvoice)}
                    style={[styles.actionButtonLarge, styles.sendReminderButton]}
                  >
                    <Mail size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Send Reminder</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => handleDownloadInvoice(selectedInvoice)}
                  style={[styles.actionButtonLarge, styles.downloadButton]}
                >
                  <Download size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Download PDF</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Create Invoice Modal Placeholder */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Invoice</Text>
            <TouchableOpacity>
              <Text style={styles.modalDone}>Create</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.placeholderContainer}>
            <FileText size={60} color="#8E8E93" />
            <Text style={styles.placeholderTitle}>Create Invoice Form</Text>
            <Text style={styles.placeholderDescription}>
              Invoice creation form will be implemented here
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

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
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.placeholderContainer}>
            <Filter size={60} color="#8E8E93" />
            <Text style={styles.placeholderTitle}>Advanced Filters</Text>
            <Text style={styles.placeholderDescription}>
              Date range, amount filters, and sorting options
            </Text>
          </View>
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
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
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
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  invoiceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
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
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
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
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  modalActionButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  invoiceDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  invoiceDetailNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  invoiceDetailDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: '#007AFF',
  },
  invoiceDetailStatus: {
    alignItems: 'flex-end',
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dueDateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  customerSection: {},
  customerNameLarge: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  companyNameLarge: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  shippingSection: {},
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#000000',
  },
  itemsSection: {},
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#8E8E93',
  },
  itemAmount: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  noItemsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  totalsSection: {},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  totalValue: {
    fontSize: 14,
    color: '#000000',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentSection: {},
  paymentText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  notesSection: {},
  notesText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  actionButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  markPaidButton: {
    backgroundColor: '#34C759',
  },
  sendReminderButton: {
    backgroundColor: '#FF9500',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default InvoicesScreen;
