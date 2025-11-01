import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DeploymentStageData } from './deployment-stage';

interface DeploymentStagesEditorProps {
  stages: DeploymentStageData[];
  onStagesChange: (stages: DeploymentStageData[]) => void;
}

export function DeploymentStagesEditor({
  stages,
  onStagesChange,
}: DeploymentStagesEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingStage, setEditingStage] = useState<DeploymentStageData | null>(null);

  const handleAddStage = () => {
    const newStage: DeploymentStageData = {
      index: stages.length + 1,
      entryTime: '09:15',
      exitTime: undefined,
      callPutType: 'CE',
      type: 'BUY',
      strike: '25500',
      bidPrice: 0,
      askPrice: 0,
      quantity: 1,
      ltp: 0,
      pnl: 0,
    };
    onStagesChange([...stages, newStage]);
  };

  const handleDeleteStage = (index: number) => {
    Alert.alert('Delete Stage', 'Are you sure you want to delete this stage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedStages = stages.filter((_, i) => i !== index);
          // Reindex
          updatedStages.forEach((stage, idx) => {
            stage.index = idx + 1;
          });
          onStagesChange(updatedStages);
        },
      },
    ]);
  };

  const handleEditStage = (stage: DeploymentStageData, index: number) => {
    setEditingStage({ ...stage });
    setEditingIndex(index);
  };

  const handleSaveStage = () => {
    if (!editingStage) return;

    const updatedStages = [...stages];
    updatedStages[editingIndex!] = editingStage;
    onStagesChange(updatedStages);
    setEditingIndex(null);
    setEditingStage(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deployment Stages</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddStage}
        >
          <Text style={styles.addButtonText}>+ Add Stage</Text>
        </TouchableOpacity>
      </View>

      {editingIndex !== null && editingStage ? (
        <View style={styles.editorContainer}>
          <Text style={styles.editorTitle}>Edit Stage {editingIndex + 1}</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Entry Time</Text>
            <TextInput
              style={styles.input}
              placeholder="09:15"
              value={editingStage.entryTime}
              onChangeText={(text) =>
                setEditingStage({ ...editingStage, entryTime: text })
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Exit Time (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="15:30"
              value={editingStage.exitTime || ''}
              onChangeText={(text) =>
                setEditingStage({ ...editingStage, exitTime: text })
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Call/Put Type</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  editingStage.callPutType === 'CE' && styles.toggleButtonActive,
                ]}
                onPress={() => setEditingStage({ ...editingStage, callPutType: 'CE' })}
              >
                <Text style={[
                  styles.toggleButtonText,
                  editingStage.callPutType === 'CE' && styles.toggleButtonTextActive,
                ]}>
                  CE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  editingStage.callPutType === 'PE' && styles.toggleButtonActive,
                ]}
                onPress={() => setEditingStage({ ...editingStage, callPutType: 'PE' })}
              >
                <Text style={[
                  styles.toggleButtonText,
                  editingStage.callPutType === 'PE' && styles.toggleButtonTextActive,
                ]}>
                  PE
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  editingStage.type === 'BUY' && styles.toggleButtonActive,
                ]}
                onPress={() => setEditingStage({ ...editingStage, type: 'BUY' })}
              >
                <Text style={[
                  styles.toggleButtonText,
                  editingStage.type === 'BUY' && styles.toggleButtonTextActive,
                ]}>
                  BUY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  editingStage.type === 'SELL' && styles.toggleButtonActive,
                ]}
                onPress={() => setEditingStage({ ...editingStage, type: 'SELL' })}
              >
                <Text style={[
                  styles.toggleButtonText,
                  editingStage.type === 'SELL' && styles.toggleButtonTextActive,
                ]}>
                  SELL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Strike</Text>
            <TextInput
              style={styles.input}
              placeholder="25500"
              keyboardType="decimal-pad"
              value={editingStage.strike}
              onChangeText={(text) =>
                setEditingStage({ ...editingStage, strike: text })
              }
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Bid Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={String(editingStage.bidPrice)}
                onChangeText={(text) =>
                  setEditingStage({ ...editingStage, bidPrice: parseFloat(text) || 0 })
                }
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Ask Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={String(editingStage.askPrice)}
                onChangeText={(text) =>
                  setEditingStage({ ...editingStage, askPrice: parseFloat(text) || 0 })
                }
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                keyboardType="number-pad"
                value={String(editingStage.quantity)}
                onChangeText={(text) =>
                  setEditingStage({ ...editingStage, quantity: parseInt(text) || 1 })
                }
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>LTP</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={String(editingStage.ltp)}
                onChangeText={(text) =>
                  setEditingStage({ ...editingStage, ltp: parseFloat(text) || 0 })
                }
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>P/L</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={String(editingStage.pnl)}
              onChangeText={(text) =>
                setEditingStage({ ...editingStage, pnl: parseFloat(text) || 0 })
              }
            />
          </View>

          <View style={styles.editorFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditingIndex(null);
                setEditingStage(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveStage}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.stagesList}>
          {stages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No deployment stages added yet
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddStage}
              >
                <Text style={styles.emptyStateButtonText}>+ Add First Stage</Text>
              </TouchableOpacity>
            </View>
          ) : (
            stages.map((stage, index) => (
              <View key={index} style={styles.stageCard}>
                <View style={styles.stageCardHeader}>
                  <Text style={styles.stageCardTitle}>
                    Stage {stage.index}: {stage.type} {stage.callPutType} {stage.strike}
                  </Text>
                  <View style={styles.stageCardActions}>
                    <TouchableOpacity
                      style={styles.editIcon}
                      onPress={() => handleEditStage(stage, index)}
                    >
                      <Text style={styles.editIconText}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => handleDeleteStage(index)}
                    >
                      <Text style={styles.deleteIconText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.stageCardContent}>
                  <View style={styles.stageRow}>
                    <Text style={styles.stageLabel}>Entry:</Text>
                    <Text style={styles.stageValue}>{stage.entryTime}</Text>
                  </View>
                  {stage.exitTime && (
                    <View style={styles.stageRow}>
                      <Text style={styles.stageLabel}>Exit:</Text>
                      <Text style={styles.stageValue}>{stage.exitTime}</Text>
                    </View>
                  )}
                  <View style={styles.stageRow}>
                    <Text style={styles.stageLabel}>Price Range:</Text>
                    <Text style={styles.stageValue}>
                      ₹{stage.bidPrice.toFixed(2)} - ₹{stage.askPrice.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.stageRow}>
                    <Text style={styles.stageLabel}>P/L:</Text>
                    <Text style={[
                      styles.stageValue,
                      stage.pnl >= 0 ? styles.profitText : styles.lossText
                    ]}>
                      {stage.pnl >= 0 ? '+' : ''}₹{stage.pnl.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  editorContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  editorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#1e40af',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  editorFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  stagesList: {
    maxHeight: 300,
    padding: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stageCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  stageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stageCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  stageCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  deleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  stageCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  stageValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  profitText: {
    color: '#22c55e',
  },
  lossText: {
    color: '#ef4444',
  },
});
