import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BookDetailsScreen = ({ route, navigation }) => {
  const { book } = route.params;

  const handleRequestBook = () => {
    if (book.availability.status !== 'available') {
      Alert.alert('Unavailable', 'This book is currently not available for rental.');
      return;
    }

    Alert.alert(
      'Request Book',
      `Do you want to request "${book.title}" for $${book.rental.pricePerDay}/day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            Alert.alert('Success', 'Book request submitted successfully!');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const DetailRow = ({ label, value, icon }) => (
    <View style={styles.detailRow}>
      <Icon name={icon} size={20} color="#666" />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
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
        <Text style={styles.headerTitle}>Book Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>by {book.author}</Text>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: book.availability.status === 'available' ? '#4CAF50' : '#F44336'
              }
            ]}>
              <Text style={styles.statusText}>
                {book.availability.status === 'available' ? 'Available' : 'Borrowed'}
              </Text>
            </View>
            <Text style={styles.priceText}>${book.rental.pricePerDay}/day</Text>
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{book.description}</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <DetailRow
            label="Genre"
            value={book.genre}
            icon="category"
          />
          
          <DetailRow
            label="Condition"
            value={book.condition}
            icon="info"
          />
          
          <DetailRow
            label="Publisher"
            value={book.publisher.fullName}
            icon="store"
          />
          
          {book.isbn && (
            <DetailRow
              label="ISBN"
              value={book.isbn}
              icon="confirmation-number"
            />
          )}
          
          {book.language && (
            <DetailRow
              label="Language"
              value={book.language}
              icon="language"
            />
          )}
          
          {book.pages && (
            <DetailRow
              label="Pages"
              value={book.pages.toString()}
              icon="description"
            />
          )}
          
          {book.publishedYear && (
            <DetailRow
              label="Published Year"
              value={book.publishedYear.toString()}
              icon="date-range"
            />
          )}
        </View>

        {book.rental.maxRentalDays && (
          <View style={styles.rentalInfo}>
            <Text style={styles.sectionTitle}>Rental Information</Text>
            <View style={styles.rentalDetails}>
              <Text style={styles.rentalText}>
                Maximum rental period: {book.rental.maxRentalDays} days
              </Text>
              <Text style={styles.rentalText}>
                Late fee: $0.50 per day after due date
              </Text>
              <Text style={styles.rentalText}>
                Security deposit may be required for some books
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.requestButton,
            {
              backgroundColor: book.availability.status === 'available' ? '#2196F3' : '#ccc'
            }
          ]}
          onPress={handleRequestBook}
          disabled={book.availability.status !== 'available'}
        >
          <Icon name="request-page" size={20} color="#fff" />
          <Text style={styles.requestButtonText}>
            {book.availability.status === 'available' ? 'Request Book' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  bookInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  description: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  details: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  rentalInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  rentalDetails: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  rentalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default BookDetailsScreen;
