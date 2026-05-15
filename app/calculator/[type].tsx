import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/ThemeContext';
import { getColors } from '../../constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { generateLocalPDF } from '../../constants/pdfGenerator';
import {
  CalcEntry,
  CalcType,
  InputSystem,
  MeasureUnit,
  Party,
  SavedReport,
  calcVolumeCBM, cbmToCft, genId,
  getParties,
  getUnit, saveReport,
} from '../../constants/storage';

const TITLE: Record<CalcType, string> = {
  'round-log': 'Round Log Calculator',
  'round-log-cbm': 'Round Log (CBM)',
  'cut-size': 'Cut Size Calculator',
  'plywood': 'Plywood / Door Calc',
};

export default function CalculatorScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const calcType = type as CalcType;

  const [entries, setEntries] = useState<CalcEntry[]>([]);
  const [unit, setUnitState] = useState<MeasureUnit>('CBM');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveClient, setSaveClient] = useState('');
  const [inputSystem, setInputSystem] = useState<InputSystem>('m-cm');
  const [showSystemPicker, setShowSystemPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [showPartyPicker, setShowPartyPicker] = useState(false);

  const [name, setName] = useState('');
  const [length, setLength] = useState('');
  const [girth, setGirth] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [rate, setRate] = useState('');
  const [nos, setNos] = useState('');
  const [allowance, setAllowance] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    getUnit().then(setUnitState);
    getParties().then(setParties);
  }, []);

  const s = makeStyles(C);

  const isRound = calcType === 'round-log' || calcType === 'round-log-cbm';
  const isCut = calcType === 'cut-size' || calcType === 'plywood';

  function clearForm() {
    setName(''); setLength(''); setGirth('');
    setWidth(''); setThickness(''); setNos(''); setRate('');
    setAllowance(''); setEditingId(null);
  }

  function editEntry(e: CalcEntry) {
    setEditingId(e.id);
    setName(e.name);
    setLength(e.length.toString());
    setGirth(e.girth?.toString() || '');
    setWidth(e.width?.toString() || '');
    setThickness(e.thickness?.toString() || '');
    setNos(e.nos.toString());
    setRate(e.rate.toString());
    setAllowance(e.allowance?.toString() || '');
    setInputSystem(e.inputSystem);
  }

  function addEntry() {
    if (!length || !rate) { Alert.alert('Required', 'Length and Rate are required.'); return; }
    const partial: Partial<CalcEntry> = {
      length: parseFloat(length),
      girth: girth ? parseFloat(girth) : undefined,
      width: width ? parseFloat(width) : undefined,
      thickness: thickness ? parseFloat(thickness) : undefined,
      nos: nos ? parseFloat(nos) : 1,
      rate: parseFloat(rate),
      allowance: allowance ? parseFloat(allowance) : 0,
      unit,
      inputSystem,
    };
    const volCBM = calcVolumeCBM(calcType, partial);
    const vol = unit === 'CFT' ? cbmToCft(volCBM) : volCBM;
    const value = vol * (partial.rate ?? 0);

    const newEntry: CalcEntry = {
      id: editingId || genId(),
      name: name || `Item ${entries.length + 1}`,
      length: partial.length!, girth: partial.girth, width: partial.width,
      thickness: partial.thickness, nos: partial.nos!, rate: partial.rate!,
      allowance: partial.allowance!,
      unit, volume: vol, value, inputSystem,
    };

    if (editingId) {
      setEntries(prev => prev.map(e => e.id === editingId ? newEntry : e));
    } else {
      setEntries(prev => [...prev, newEntry]);
    }
    clearForm();
  }

  function removeEntry(id: string) {
    Alert.alert('Remove', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setEntries(p => p.filter(e => e.id !== id)) },
    ]);
  }

  const totalVolume = entries.reduce((s, e) => s + e.volume, 0);
  const totalValue = entries.reduce((s, e) => s + e.value, 0);

  async function handleSave(download = false) {
    if (!saveTitle.trim()) { Alert.alert('Required', 'Enter a project title.'); return; }
    const finalVal = totalValue * (1 + (parseFloat(tax) || 0) / 100) - (parseFloat(discount) || 0);
    const report: SavedReport = {
      id: genId(), title: saveTitle, client: saveClient,
      calcType, entries, totalVolume, totalValue: finalVal, unit,
      date: selectedDate.toISOString(), status: 'Final',
      discount: discount ? parseFloat(discount) : 0,
      tax: tax ? parseFloat(tax) : 0,
    };
    await saveReport(report);
    setShowSaveModal(false);
    if (download) {
      await handlePDFDownload(report as SavedReport);
    } else {
      Alert.alert('Saved!', 'Report saved.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }

  async function handlePDFDownload(report: SavedReport) {
    try {
      await generateLocalPDF(report);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF locally');
    }
  }

  async function handleShare() {
    if (entries.length === 0) { Alert.alert('Error', 'No entries to share.'); return; }

    let text = `*${TITLE[calcType]}*\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    if (saveClient) text += `Client: ${saveClient}\n`;
    text += `--------------------------\n`;

    entries.forEach((e, i) => {
      text += `${i + 1}. ${e.name}: ${e.length}x${isRound ? e.girth : e.width}`;
      if (e.allowance > 0) text += ` (A:${e.allowance})`;
      text += ` = ${e.volume.toFixed(3)} ${unit}\n`;
    });

    text += `--------------------------\n`;
    text += `*Total Volume: ${totalVolume.toFixed(3)} ${unit}*\n`;
    text += `Total Pieces: ${entries.length}\n`;
    text += `Total Value: $${totalValue.toFixed(2)}\n`;

    const fileUri = FileSystem.cacheDirectory + 'report.txt';
    await FileSystem.writeAsStringAsync(fileUri, text);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Error', 'Sharing not available on this device');
    }
  }

  const insets = useSafeAreaInsets();
  return (
    <View style={s.safe}>
      {/* Status Bar Spacer */}
      <View style={{ height: StatusBar.currentHeight, backgroundColor: C.headerBg }} />
      {/* Header */}
      <View style={[s.header, { paddingTop: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={C.headerText} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.headerText }]}>{TITLE[calcType]}</Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => setShowSaveModal(true)}>
            <Ionicons name="save-outline" size={22} color={C.headerText} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/saved')}>
            <Ionicons name="document-text-outline" size={22} color={C.headerText} />
          </TouchableOpacity>
        </View>
      </View>


      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          {/* Entries table */}
          {entries.length > 0 && (
            <View style={s.table}>
              <View style={s.tableHead}>
                <Text style={[s.th, { width: 26 }]}>#</Text>
                <Text style={[s.th, { flex: 1 }]}>L (m) × G (cm)</Text>
                <Text style={[s.th, { width: 100, textAlign: 'right' }]}>Volume ({unit})</Text>
              </View>
              {entries.map((e, i) => (
                <TouchableOpacity key={e.id} style={[s.tableRow, editingId === e.id && { backgroundColor: C.borderLight }]} onPress={() => editEntry(e)}>
                  <Text style={[s.tdNum, { width: 26 }]}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.td}>{e.name}</Text>
                    <Text style={s.tdSub}>
                      {e.length.toFixed(2)}{e.inputSystem === 'ft-in' ? "'" : e.inputSystem === 'cm-cm' ? 'cm' : 'm'} × {isRound ? e.girth : e.width}{e.inputSystem === 'ft-in' ? '"' : 'cm'}
                      {e.allowance && e.allowance > 0 ? ` (A: ${e.allowance})` : ''}
                      {' , $'}{e.rate.toFixed(2)} / {unit}
                    </Text>
                  </View>
                  <View style={{ width: 80, alignItems: 'flex-end' }}>
                    <Text style={[s.td, { color: C.accentText }]}>{e.volume.toFixed(3)}</Text>
                    <Text style={s.tdSub}>${e.value.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeEntry(e.id)} style={{ paddingLeft: 10 }}>
                    <Ionicons name="trash-outline" size={16} color={C.danger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {/* Totals */}
              <View style={s.totalLabelRow}>
                <Text style={s.totalLabel}>Total Pieces</Text>
                <Text style={s.totalLabel}>Total Volume &amp; Value</Text>
              </View>
              <View style={s.totalValRow}>
                <Text style={s.totalPieces}>
                  {entries.length} {isRound ? 'Logs' : 'Pcs'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                  <Text style={[s.totalVol, { color: C.accentText }]}>{totalVolume.toFixed(3)}</Text>
                  <Text style={s.totalUnit}>{unit}</Text>
                  <Text style={s.totalVal}>(${totalValue.toFixed(2)})</Text>
                </View>
              </View>
            </View>
          )}

          {/* Form */}
          <View style={s.form}>
            <View style={s.row2}>
              <View style={s.field}>
                <Text style={s.label}>Item Name</Text>
                <TextInput style={s.input} value={name} onChangeText={setName}
                  placeholder="Item Name" placeholderTextColor={C.textMuted} />
              </View>
              <View style={s.field}>
                <Text style={s.label}>Measured in</Text>
                <TouchableOpacity style={[s.input, s.inputRow]} onPress={() => setShowSystemPicker(true)}>
                  <Text style={{ color: C.text, fontSize: 13 }}>
                    {inputSystem === 'm-cm' ? 'M x Cm' : inputSystem === 'cm-cm' ? 'Cm x Cm' : 'Ft x In'}
                  </Text>
                  <Ionicons name="chevron-down" size={13} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.row2}>
              <View style={s.field}>
                <Text style={s.label}>Length ({inputSystem === 'm-cm' ? 'm' : inputSystem === 'cm-cm' ? 'cm' : 'ft'})</Text>
                <TextInput style={s.input} value={length} onChangeText={setLength}
                  keyboardType="decimal-pad" placeholder={inputSystem === 'ft-in' ? "10'" : "5.20"} placeholderTextColor={C.textMuted} />
              </View>
              {isRound ? (
                <View style={s.field}>
                  <Text style={s.label}>Girth ({inputSystem === 'ft-in' ? 'in' : 'cm'})</Text>
                  <TextInput style={s.input} value={girth} onChangeText={setGirth}
                    keyboardType="decimal-pad" placeholder={inputSystem === 'ft-in' ? '40"' : "110"} placeholderTextColor={C.textMuted} />
                </View>
              ) : (
                <View style={s.field}>
                  <Text style={s.label}>Width ({inputSystem === 'ft-in' ? 'in' : 'cm'})</Text>
                  <TextInput style={s.input} value={width} onChangeText={setWidth}
                    keyboardType="decimal-pad" placeholder={inputSystem === 'ft-in' ? '12"' : "110"} placeholderTextColor={C.textMuted} />
                </View>
              )}
            </View>

            {isCut && (
              <View style={s.row2}>
                <View style={s.field}>
                  <Text style={s.label}>Thickness</Text>
                  <TextInput style={s.input} value={thickness} onChangeText={setThickness}
                    keyboardType="decimal-pad" placeholder="450" placeholderTextColor={C.textMuted} />
                </View>
                <View style={s.field} />
              </View>
            )}

            <View style={s.row2}>
              <View style={s.field}>
                <Text style={s.label}>Nos.</Text>
                <TextInput style={s.input} value={nos} onChangeText={setNos}
                  keyboardType="number-pad" placeholder="1" placeholderTextColor={C.textMuted} />
              </View>
              <View style={s.field}>
                <Text style={s.label}>Rate ($)</Text>
                <TextInput style={s.input} value={rate} onChangeText={setRate}
                  keyboardType="decimal-pad" placeholder="450" placeholderTextColor={C.textMuted} />
              </View>
            </View>

            <View style={s.row2}>
              <View style={s.field}>
                <Text style={s.label}>Allowance</Text>
                <TextInput style={s.input} value={allowance} onChangeText={setAllowance}
                  keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.textMuted} />
              </View>
              <View style={s.field}>
                <Text style={s.label}>Unit</Text>
                <TouchableOpacity style={[s.input, s.inputRow]} onPress={() => setShowUnitPicker(true)}>
                  <Text style={{ color: C.text, fontSize: 13 }}>{unit}</Text>
                  <Ionicons name="chevron-down" size={13} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.clearBtn} onPress={clearForm}>
                <Text style={s.clearBtnText}>{editingId ? 'CANCEL' : 'CLEAR'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.addBtn, editingId && { backgroundColor: C.accentText }]} onPress={addEntry}>
                <Ionicons name={editingId ? "checkmark-circle" : "add-circle"} size={17} color={C.white} />
                <Text style={s.addBtnText}>{editingId ? 'UPDATE ENTRY' : 'ADD ENTRY'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {entries.length > 0 && (
            <TouchableOpacity style={s.saveBtn} onPress={() => setShowSaveModal(true)}>
              <Ionicons name="save-outline" size={18} color={C.white} />
              <Text style={s.saveBtnText}>Save Report</Text>
            </TouchableOpacity>
          )}
          {/* bottom padding so FAB doesn't cover content */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating ADD button */}
      <TouchableOpacity style={s.fab} onPress={addEntry}>
        <Ionicons name="add" size={32} color={C.white} />
      </TouchableOpacity>

      {/* Unit picker */}
      <Modal visible={showUnitPicker} transparent animationType="slide">
        <View style={s.overlay}>
          <TouchableOpacity style={s.overlayBg} onPress={() => setShowUnitPicker(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Select Measurement Unit</Text>
              <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            {(['CFT', 'CBM'] as MeasureUnit[]).map(u => (
              <TouchableOpacity
                key={u}
                style={[s.unitRow, unit === u && s.unitRowActive]}
                onPress={() => { setUnitState(u); setShowUnitPicker(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.unitLabel}>{u === 'CFT' ? 'Cubic Feet (CFT)' : 'Cubic Meter (CBM)'}</Text>
                  <Text style={s.unitSub}>{u === 'CFT' ? 'Imperial standard for timber' : 'Metric standard for export'}</Text>
                </View>
                <View style={[s.radio, unit === u && s.radioOn]}>
                  {unit === u && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* System picker */}
      <Modal visible={showSystemPicker} transparent animationType="slide">
        <View style={s.overlay}>
          <TouchableOpacity style={s.overlayBg} onPress={() => setShowSystemPicker(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Select Input System</Text>
              <TouchableOpacity onPress={() => setShowSystemPicker(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            {[
              { id: 'm-cm', label: 'Metric (M x Cm)', sub: 'Standard: Meters and Centimeters' },
              { id: 'cm-cm', label: 'Full Metric (Cm x Cm)', sub: 'All measurements in Centimeters' },
              { id: 'ft-in', label: 'Imperial (Ft x In)', sub: 'Length in Feet, Width in Inches' },
            ].map(sys => (
              <TouchableOpacity
                key={sys.id}
                style={[s.unitRow, inputSystem === sys.id && s.unitRowActive]}
                onPress={() => { setInputSystem(sys.id as InputSystem); setShowSystemPicker(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.unitLabel}>{sys.label}</Text>
                  <Text style={s.unitSub}>{sys.sub}</Text>
                </View>
                <View style={[s.radio, inputSystem === sys.id && s.radioOn]}>
                  {inputSystem === sys.id && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Redesigned Save modal (Full Screen) */}
      <Modal visible={showSaveModal} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[s.safe, { backgroundColor: C.card }]}>
          <View style={s.fullSheet}>
            <View style={s.sheetHeader}>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Ionicons name="arrow-back" size={24} color={C.text} />
              </TouchableOpacity>
              <Text style={[s.sheetTitle, { flex: 1, textAlign: 'center', marginRight: 24 }]}>Save Details</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
              <View style={s.dateTimeRow}>
                <Text style={s.dateLabel}>Date</Text>
                <TouchableOpacity style={s.dateValueBox} onPress={() => setShowDatePicker(true)}>
                  <Text style={s.dateValueText}>{selectedDate.toLocaleDateString('en-GB').replace(/\//g, '-')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.dateValueBox} onPress={() => setShowTimePicker(true)}>
                  <Text style={s.dateValueText}>{selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && date) {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setSelectedDate(newDate);
                    }
                  }}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                  is24Hour={true}
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (event.type === 'set' && date) {
                      const newDate = new Date(selectedDate);
                      newDate.setHours(date.getHours(), date.getMinutes());
                      setSelectedDate(newDate);
                    }
                  }}
                />
              )}

              <TextInput
                style={s.saveInput}
                placeholder="Party Name"
                placeholderTextColor={C.textMuted}
                value={saveClient}
                onChangeText={setSaveClient}
              />
              <TextInput
                style={s.saveInput}
                placeholder="Description"
                placeholderTextColor={C.textMuted}
                value={saveTitle}
                onChangeText={setSaveTitle}
              />

              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Bill Total</Text>
                <Text style={s.summaryVal}>{totalValue.toFixed(1)}</Text>
              </View>

              <View style={[s.saveInputRow, { alignItems: 'center' }]}>
                <Text style={s.calcLabel}>Add Tax</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                  <TextInput
                    style={s.underlineInput}
                    keyboardType="decimal-pad"
                    value={tax}
                    onChangeText={setTax}
                    placeholder="0.0"
                  />
                  <Text style={s.calcPercent}>%</Text>
                </View>
                <Text style={[s.summaryVal, { width: 80, textAlign: 'right', fontSize: 15, fontWeight: '400' }]}>
                  {(totalValue * (parseFloat(tax) || 0) / 100).toFixed(1)}
                </Text>
              </View>

              <View style={[s.saveInputRow, { alignItems: 'center' }]}>
                <Text style={s.calcLabel}>Less Discount</Text>
                <TextInput
                  style={[s.underlineInput, { flex: 1, textAlign: 'right' }]}
                  keyboardType="decimal-pad"
                  value={discount}
                  onChangeText={setDiscount}
                  placeholder="0.0"
                />
              </View>

              <View style={[s.summaryRow, { marginTop: 10 }]}>
                <Text style={s.grandTotalLabel}>Grand Total</Text>
                <Text style={s.grandTotalVal}>
                  {(totalValue * (1 + (parseFloat(tax) || 0) / 100) - (parseFloat(discount) || 0)).toFixed(1)}
                </Text>
              </View>

              <View style={[s.saveBtnRow, { flexDirection: 'column', gap: 10 }]}>
                <TouchableOpacity style={s.modalSaveBtn} onPress={() => handleSave(false)}>
                  <Text style={s.modalSaveText}>SAVE REPORT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalSaveBtn, { backgroundColor: C.accentText }]} onPress={() => handleSave(true)}>
                  <Ionicons name="document-text" size={18} color={C.white} style={{ marginRight: 8 }} />
                  <Text style={s.modalSaveText}>SAVE & DOWNLOAD PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowSaveModal(false)}>
                  <Text style={s.modalCancelText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Party Picker Modal */}
      <Modal visible={showPartyPicker} transparent animationType="slide">
        <View style={s.overlay}>
          <TouchableOpacity style={s.overlayBg} onPress={() => setShowPartyPicker(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Select Party</Text>
              <TouchableOpacity onPress={() => setShowPartyPicker(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {parties.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.unitRow, { marginBottom: 8 }]}
                  onPress={() => { setSaveClient(p.name); setShowPartyPicker(false); }}
                >
                  <Text style={s.unitLabel}>{p.name}</Text>
                </TouchableOpacity>
              ))}
              {parties.length === 0 && (
                <Text style={{ textAlign: 'center', color: C.textMuted, marginVertical: 20 }}>No parties saved. Add them in "All Parties".</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 12,
      backgroundColor: C.headerBg,
    },
    headerBtn: { padding: 6 },
    headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.white, marginLeft: 4 },
    headerRight: { flexDirection: 'row' },

    body: { padding: 14, gap: 14 },

    /* Table */
    table: {
      backgroundColor: C.card, borderRadius: 12,
      borderWidth: 1, borderColor: C.border, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    },
    tableHead: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    th: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
    tableRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: C.borderLight,
    },
    tdNum: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
    td: { fontSize: 13, color: C.text, fontWeight: '500' },
    tdSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
    totalLabelRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingTop: 8,
    },
    totalLabel: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
    totalValRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 12, paddingBottom: 12, paddingTop: 3,
    },
    totalPieces: { fontSize: 15, fontWeight: '700', color: C.text },
    totalVol: { fontSize: 22, fontWeight: '800' },
    totalUnit: { fontSize: 11, color: C.textMuted },
    totalVal: { fontSize: 14, fontWeight: '700', color: C.text },

    /* Form */
    form: {
      backgroundColor: C.card, borderRadius: 12,
      borderWidth: 1, borderColor: C.border, padding: 14, gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    },
    row2: { flexDirection: 'row', gap: 10 },
    field: { flex: 1 },
    label: { fontSize: 11, color: C.textMuted, marginBottom: 5, fontWeight: '500' },
    input: {
      backgroundColor: C.inputBg, borderRadius: 8,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 10, paddingVertical: 10,
      color: C.text, fontSize: 14,
    },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
    clearBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 8,
      borderWidth: 1, borderColor: C.border, alignItems: 'center',
      backgroundColor: C.card,
    },
    clearBtnText: { color: C.text, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
    addBtn: {
      flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, backgroundColor: C.btnGreen, paddingVertical: 12, borderRadius: 8,
    },
    addBtnText: { color: C.white, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: C.btnGreen, paddingVertical: 14, borderRadius: 12,
    },
    fab: {
      position: 'absolute', bottom: 24, right: 24,
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: C.btnGreen,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
    },
    saveBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

    /* Sheet */
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
    overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    sheet: {
      backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 20, gap: 10,
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 2, backgroundColor: C.border,
      alignSelf: 'center', marginBottom: 6,
    },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sheetTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    unitRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.bg, borderRadius: 10, padding: 14,
      borderWidth: 1.5, borderColor: C.border,
    },
    unitRowActive: { borderColor: C.accentBorder, backgroundColor: C.unitRowActive },
    unitLabel: { fontSize: 14, fontWeight: '600', color: C.text },
    unitSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
    radio: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: C.border,
      justifyContent: 'center', alignItems: 'center',
    },
    radioOn: { borderColor: C.accentText },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accentText },

    /* Full Screen Save Modal Styles */
    fullSheet: { flex: 1 },
    saveModalSheet: {
      backgroundColor: C.white, width: '92%', borderRadius: 12, padding: 20, gap: 15,
      shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
    },
    dateTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
    dateLabel: { fontSize: 12, color: C.textMuted },
    dateValueBox: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    dateValueText: { fontSize: 13, color: C.text, fontWeight: '500' },
    saveInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, fontSize: 14, color: C.text },
    saveInputRow: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, flexDirection: 'row' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 13, color: '#666' },
    summaryVal: { fontSize: 18, fontWeight: '400', color: C.text },
    calcLabel: { fontSize: 13, color: '#666' },
    underlineInput: { borderBottomWidth: 1, borderBottomColor: '#666', width: 60, textAlign: 'center', padding: 0, fontSize: 14, color: C.text },
    calcPercent: { fontSize: 14, color: '#666' },
    grandTotalLabel: { fontSize: 14, color: '#666' },
    grandTotalVal: { fontSize: 22, fontWeight: '700', color: C.text },
    saveBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalCancelBtn: { flex: 1, backgroundColor: C.borderLight, paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
    modalCancelText: { fontWeight: '600', color: C.text },
    modalSaveBtn: { flex: 1, backgroundColor: C.headerBg, paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
    modalSaveText: { fontWeight: '600', color: C.white },
  });
}

