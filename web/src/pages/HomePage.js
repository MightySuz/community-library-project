import React from 'react';
import { Container, Typography, Button, Box, Grid, Card, CardContent, CardActions } from '@mui/material';
import { Book, People, TrendingUp, Security } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const features = [
    {
      icon: <Book sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Extensive Library',
      description: 'Access thousands of books from community members. Find rare titles and popular bestsellers.'
    },
    {
      icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Community Driven',
      description: 'Connect with book lovers in your area. Share, borrow, and discover new reading adventures.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Smart Recommendations',
      description: 'Get personalized book recommendations based on your reading history and preferences.'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure & Reliable',
      description: 'Safe transactions with built-in wallet system and verified community members.'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: 2
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom align="center" fontWeight="bold">
            Welcome to Community Library
          </Typography>
          <Typography variant="h5" align="center" sx={{ mb: 4, opacity: 0.9 }}>
            Share books, build community, discover new worlds of knowledge
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              component={Link}
              to="/register"
              sx={{ px: 4, py: 1.5 }}
            >
              Join Community
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/books"
              sx={{ px: 4, py: 1.5, borderColor: 'white', color: 'white' }}
            >
              Browse Books
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          Why Choose Our Platform?
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Stats Section */}
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Join Our Growing Community
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                10,000+
              </Typography>
              <Typography variant="h6">
                Books Available
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                5,000+
              </Typography>
              <Typography variant="h6">
                Active Members
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                25,000+
              </Typography>
              <Typography variant="h6">
                Successful Exchanges
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            p: 6,
            borderRadius: 2,
            textAlign: 'center',
            my: 6
          }}
        >
          <Typography variant="h4" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Join thousands of book lovers in our community
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            component={Link}
            to="/register"
            sx={{ px: 6, py: 2 }}
          >
            Get Started Today
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
