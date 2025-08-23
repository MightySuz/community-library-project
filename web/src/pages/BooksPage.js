import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  Pagination
} from '@mui/material';
import { Search, Book, Person, Schedule } from '@mui/icons-material';

const BooksPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Mock books data
  const books = [
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      rating: 4.5,
      available: true,
      publisher: 'Sarah Johnson',
      rentPrice: 2.50,
      image: '/api/placeholder/200/300',
      description: 'A classic American novel set in the Jazz Age...'
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      rating: 4.8,
      available: true,
      publisher: 'Mike Wilson',
      rentPrice: 3.00,
      image: '/api/placeholder/200/300',
      description: 'A gripping tale of racial injustice and childhood innocence...'
    },
    {
      id: 3,
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      rating: 4.7,
      available: false,
      publisher: 'Emma Davis',
      rentPrice: 2.75,
      image: '/api/placeholder/200/300',
      description: 'A dystopian social science fiction novel...'
    },
    {
      id: 4,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0-14-143951-8',
      rating: 4.6,
      available: true,
      publisher: 'Lisa Brown',
      rentPrice: 2.25,
      image: '/api/placeholder/200/300',
      description: 'A romantic novel of manners...'
    },
    {
      id: 5,
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '978-0-316-76948-0',
      rating: 4.2,
      available: true,
      publisher: 'David Miller',
      rentPrice: 2.80,
      image: '/api/placeholder/200/300',
      description: 'A coming-of-age story...'
    },
    {
      id: 6,
      title: 'Lord of the Flies',
      author: 'William Golding',
      isbn: '978-0-571-05686-2',
      rating: 4.3,
      available: true,
      publisher: 'Jennifer Taylor',
      rentPrice: 2.60,
      image: '/api/placeholder/200/300',
      description: 'A novel about a group of British boys...'
    }
  ];

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRentBook = (book) => {
    console.log('Renting book:', book);
    // Here you would implement the rental logic
    alert(`Requesting to rent "${book.title}" for $${book.rentPrice}`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Typography variant="h4" gutterBottom>
          Browse Books
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover and rent books from our community library
        </Typography>

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 600 }}
          />
        </Box>

        {/* Results Count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Found {filteredBooks.length} books
        </Typography>

        {/* Books Grid */}
        <Grid container spacing={3}>
          {filteredBooks.map((book) => (
            <Grid item xs={12} sm={6} md={4} key={book.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    height: 200,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <Book sx={{ fontSize: 80, color: 'grey.400' }} />
                  {!book.available && (
                    <Chip
                      label="Not Available"
                      color="error"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8
                      }}
                    />
                  )}
                  {book.available && (
                    <Chip
                      label="Available"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8
                      }}
                    />
                  )}
                </Box>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {book.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    by {book.author}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={book.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      ({book.rating})
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {book.publisher}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {book.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary.main">
                      ${book.rentPrice}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per week
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!book.available}
                    onClick={() => handleRentBook(book)}
                    startIcon={<Schedule />}
                  >
                    {book.available ? 'Rent Book' : 'Not Available'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredBooks.length / 6)}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>

        {/* Empty State */}
        {filteredBooks.length === 0 && searchQuery && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No books found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try adjusting your search terms or browse all available books
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default BooksPage;
