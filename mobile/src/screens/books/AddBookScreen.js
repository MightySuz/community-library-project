import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

const AddBookScreen = ({ navigation }) => {
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    isbn: '',
    barcode: '',
    genre: 'Fiction',
    description: '',
    condition: 'good',
    publishedYear: new Date().getFullYear().toString(),
    language: 'English',
    pages: '',
    rental: {
      pricePerDay: '',
      maxRentalDays: '14'
    },
    purchasePrice: ''
  });

  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const genres = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Thriller', 'Romance', 'Biography', 'History', 'Science', 'Self-Help',
    'Business', 'Health', 'Travel', 'Children', 'Young Adult', 'Poetry',
    'Drama', 'Comedy', 'Horror', 'Adventure', 'Educational', 'Technical',
    'Art', 'Music', 'Sports', 'Politics', 'Philosophy', 'Religion', 'Other'
  ];

  const conditions = [
    { value: 'excellent', label: 'Excellent - Like new' },
    { value: 'good', label: 'Good - Minor wear' },
    { value: 'fair', label: 'Fair - Noticeable wear' },
    { value: 'poor', label: 'Poor - Significant wear' }
  ];

  const handleSave = () => {
    if (!bookData.title.trim() || !bookData.author.trim() || !bookData.rental.pricePerDay) {
      Alert.alert('Error', 'Please fill in all required fields (Title, Author, and Rental Price)');
      return;
    }

    if (parseFloat(bookData.rental.pricePerDay) <= 0) {
      Alert.alert('Error', 'Rental price must be greater than 0');
      return;
    }

    Alert.alert(
      'Add Book',
      'Are you sure you want to add this book to the library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Book',
          onPress: () => {
            Alert.alert('Success', 'Book added successfully and sent for admin approval!');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const InputField = ({ label, value, onChangeText, placeholder, required = false, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const PickerField = ({ label, value, onPress, required = false }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity style={styles.pickerButton} onPress={onPress}>
        <Text style={styles.pickerButtonText}>{value}</Text>
        <Icon name="arrow-drop-down" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Book</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <InputField
            label="Book Title"
            value={bookData.title}
            onChangeText={(text) => setBookData({ ...bookData, title: text })}
            placeholder="Enter book title"
            required
          />

          <InputField
            label="Author"
            value={bookData.author}
            onChangeText={(text) => setBookData({ ...bookData, author: text })}
            placeholder="Enter author name"
            required
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="ISBN"
                value={bookData.isbn}
                onChangeText={(text) => setBookData({ ...bookData, isbn: text })}
                placeholder="ISBN number"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Barcode"
                value={bookData.barcode}
                onChangeText={(text) => setBookData({ ...bookData, barcode: text })}
                placeholder="Barcode"
              />
            </View>
          </View>

          <PickerField
            label="Genre"
            value={bookData.genre}
            onPress={() => setShowGenrePicker(true)}
            required
          />

          <InputField
            label="Description"
            value={bookData.description}
            onChangeText={(text) => setBookData({ ...bookData, description: text })}
            placeholder="Brief description of the book"
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Details</Text>

          <PickerField
            label="Condition"
            value={conditions.find(c => c.value === bookData.condition)?.label || 'Good - Minor wear'}
            onPress={() => setShowConditionPicker(true)}
            required
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Published Year"
                value={bookData.publishedYear}
                onChangeText={(text) => setBookData({ ...bookData, publishedYear: text })}
                placeholder="2023"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Pages"
                value={bookData.pages}
                onChangeText={(text) => setBookData({ ...bookData, pages: text })}
                placeholder="Number of pages"
                keyboardType="numeric"
              />
            </View>
          </View>

          <InputField
            label="Language"
            value={bookData.language}
            onChangeText={(text) => setBookData({ ...bookData, language: text })}
            placeholder="English"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Rental Price per Day"
                value={bookData.rental.pricePerDay}
                onChangeText={(text) => setBookData({ 
                  ...bookData, 
                  rental: { ...bookData.rental, pricePerDay: text }
                })}
                placeholder="0.00"
                keyboardType="numeric"
                required
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Max Rental Days"
                value={bookData.rental.maxRentalDays}
                onChangeText={(text) => setBookData({ 
                  ...bookData, 
                  rental: { ...bookData.rental, maxRentalDays: text }
                })}
                placeholder="14"
                keyboardType="numeric"
              />
            </View>
          </View>

          <InputField
            label="Purchase Price (Optional)"
            value={bookData.purchasePrice}
            onChangeText={(text) => setBookData({ ...bookData, purchasePrice: text })}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            * Books will be sent for admin approval before appearing in the catalog
          </Text>
        </View>
      </ScrollView>

      {/* Genre Picker Modal */}
      <Modal
        visible={showGenrePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenrePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Genre</Text>
              <TouchableOpacity onPress={() => setShowGenrePicker(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.optionItem,
                    bookData.genre === genre && styles.selectedOption
                  ]}
                  onPress={() => {
                    setBookData({ ...bookData, genre });
                    setShowGenrePicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    bookData.genre === genre && styles.selectedOptionText
                  ]}>
                    {genre}
                  </Text>
                  {bookData.genre === genre && (
                    <Icon name="check" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Condition Picker Modal */}
      <Modal
        visible={showConditionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConditionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <TouchableOpacity onPress={() => setShowConditionPicker(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.optionsList}>
              {conditions.map((condition) => (
                <TouchableOpacity
                  key={condition.value}
                  style={[
                    styles.optionItem,
                    bookData.condition === condition.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    setBookData({ ...bookData, condition: condition.value });
                    setShowConditionPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    bookData.condition === condition.value && styles.selectedOptionText
                  ]}>
                    {condition.label}
                  </Text>
                  {bookData.condition === condition.value && (
                    <Icon name="check" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  footerNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default AddBookScreen;
