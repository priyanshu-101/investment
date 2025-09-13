import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';

export default function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+91 9876543210");
  const [location, setLocation] = useState("Mumbai, India");

  const handleSave = () => {
    setEditMode(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0)}{name.split(" ")[1]?.charAt(0) || ""}</Text>
          </View>

          {editMode ? (
            <>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
              />
            </>
          ) : (
            <>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.email}>{email}</Text>
            </>
          )}
        </View>

        <View style={styles.infoCards}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>₹ 0.00</Text>
            <Text style={styles.cardLabel}>Wallet Amount</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardValue}>50.00</Text>
            <Text style={styles.cardLabel}>Backtest Credit</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardValue}>Free Plan</Text>
            <Text style={styles.cardLabel}>Active Plan</Text>
          </View>

          
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{phone}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{location}</Text>
              </View>
            </View>
        </View>

        {editMode ? (
          <>
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone"
                />
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Location"
                />
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditMode(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
              <Text style={styles.editButtonText}>✎ Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  content: { padding: 20 },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  email: { fontSize: 14, color: '#666' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    fontSize: 14,
  },
  infoCards: { marginBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardLabel: { fontSize: 14, color: '#666', marginTop: 4 },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#4A90E2',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 20,
  },
  editButtonText: { color: '#4A90E2', fontSize: 16, fontWeight: '600' },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  infoItem: { marginBottom: 15 },
  label: { fontSize: 12, color: '#666', marginBottom: 5 },
  value: { fontSize: 16, color: '#333', fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: { color: 'white', fontWeight: '600', fontSize: 16 },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#333', fontWeight: '600', fontSize: 16 },
});
