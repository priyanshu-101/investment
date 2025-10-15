import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface WalletData {
  balance: number;
  totalAdded: number;
  totalWithdrawn: number;
  totalProfit: number;
  transactions: Array<{
    id: number;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
    status: string;
  }>;
}

export default function WalletScreen() {
  const { user } = useAuth();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    totalAdded: 0,
    totalWithdrawn: 0,
    totalProfit: 0,
    transactions: []
  });

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;

    try {
      const walletKey = `wallet_data_${user.id}`;
      const savedWallet = await AsyncStorage.getItem(walletKey);
      
      if (savedWallet) {
        const parsedWallet = JSON.parse(savedWallet);
        setWalletData(parsedWallet);
      } else {
        // Initialize with default values for new users
        const defaultWallet: WalletData = {
          balance: 50000,
          totalAdded: 75000,
          totalWithdrawn: 25000,
          totalProfit: 7500,
          transactions: [
            { id: 1, type: 'credit', amount: 10000, description: 'Added money', date: '2024-01-15', status: 'completed' },
            { id: 2, type: 'debit', amount: 5000, description: 'Strategy investment', date: '2024-01-14', status: 'completed' },
            { id: 3, type: 'credit', amount: 2500, description: 'Strategy profit', date: '2024-01-13', status: 'completed' },
            { id: 4, type: 'debit', amount: 1000, description: 'Withdrawal fee', date: '2024-01-12', status: 'completed' },
            { id: 5, type: 'credit', amount: 15000, description: 'Added money', date: '2024-01-10', status: 'completed' }
          ]
        };
        
        await AsyncStorage.setItem(walletKey, JSON.stringify(defaultWallet));
        setWalletData(defaultWallet);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const saveWalletData = async (updatedData: WalletData) => {
    if (!user) return;

    try {
      const walletKey = `wallet_data_${user.id}`;
      await AsyncStorage.setItem(walletKey, JSON.stringify(updatedData));
      setWalletData(updatedData);
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  };

  const handleAddMoney = async () => {
    const addAmount = parseFloat(amount);
    if (isNaN(addAmount) || addAmount <= 0) return;

    const newTransaction = {
      id: Date.now(),
      type: 'credit' as const,
      amount: addAmount,
      description: 'Added money',
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    const updatedData = {
      ...walletData,
      balance: walletData.balance + addAmount,
      totalAdded: walletData.totalAdded + addAmount,
      transactions: [newTransaction, ...walletData.transactions]
    };

    await saveWalletData(updatedData);
    setShowAddMoney(false);
    setAmount('');
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0 || withdrawAmount > walletData.balance) return;

    const newTransaction = {
      id: Date.now(),
      type: 'debit' as const,
      amount: withdrawAmount,
      description: 'Withdrawal',
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    const updatedData = {
      ...walletData,
      balance: walletData.balance - withdrawAmount,
      totalWithdrawn: walletData.totalWithdrawn + withdrawAmount,
      transactions: [newTransaction, ...walletData.transactions]
    };

    await saveWalletData(updatedData);
    setShowWithdraw(false);
    setAmount('');
  };

  const quickAmounts = [1000, 5000, 10000, 25000];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₹{walletData.balance.toLocaleString()}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={() => setShowAddMoney(true)}
          >
            <Text style={styles.buttonText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => setShowWithdraw(true)}
          >
            <Text style={styles.buttonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{walletData.totalAdded.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Added</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{walletData.totalWithdrawn.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Withdrawn</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{walletData.totalProfit.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Profit</Text>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.transactionContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {walletData.transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={[
                styles.transactionIcon, 
                transaction.type === 'credit' ? styles.creditIcon : styles.debitIcon
              ]}>
                <Text style={styles.iconText}>
                  {transaction.type === 'credit' ? '↓' : '↑'}
                </Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount
              ]}>
                {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
              </Text>
              <Text style={styles.transactionStatus}>{transaction.status}</Text>
            </View>
          </View>
        ))}
      </View>

      <Modal
        visible={showAddMoney}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddMoney(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Money</Text>
            
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            
            <View style={styles.quickAmountContainer}>
              <Text style={styles.quickAmountLabel}>Quick amounts:</Text>
              <View style={styles.quickAmountRow}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(quickAmount.toString())}
                  >
                    <Text style={styles.quickAmountText}>₹{quickAmount.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMoney(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddMoney}
              >
                <Text style={styles.confirmButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWithdraw}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWithdraw(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Money</Text>
            
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            
            <Text style={styles.withdrawNote}>
              Available balance: ₹{walletData.balance.toLocaleString()}
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWithdraw(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleWithdraw}
              >
                <Text style={styles.confirmButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#4A90E2',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 5,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: 'white',
  },
  withdrawButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'white',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    backgroundColor: 'white',
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  transactionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  creditIcon: {
    backgroundColor: '#e8f5e8',
  },
  debitIcon: {
    backgroundColor: '#ffeaea',
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: '#28a745',
  },
  debitAmount: {
    color: '#dc3545',
  },
  transactionStatus: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    minWidth: 300,
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  quickAmountContainer: {
    marginBottom: 20,
  },
  quickAmountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quickAmountText: {
    fontSize: 12,
    color: '#333',
  },
  withdrawNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});