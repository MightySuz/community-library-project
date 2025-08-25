import React, { useState, useEffect } from 'react';
import { getBooks as fetchBackendBooks, createBook, createRequest, approveRequest, returnRequest } from './apiClient';

const App = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [userCommunity, setUserCommunity] = useState(null);
  const [allUsers, setAllUsers] = useState({}); // Store all users and their books
  const [bookRequests, setBookRequests] = useState({}); // Store all book requests (indexed by ownerEmail -> bookId)
  const [backendBooks, setBackendBooks] = useState([]);
  const [backendBooksLoaded, setBackendBooksLoaded] = useState(false);
  const [backendBooksError, setBackendBooksError] = useState(null);
  const [creatingBook, setCreatingBook] = useState(false);
  const [createBookError, setCreateBookError] = useState(null);
  
  // Define state for modals
  const [showBorrowedBooks, setShowBorrowedBooks] = useState(false);
  const [showMyBooks, setShowMyBooks] = useState(false); // user book management modal
  // Admin modals removed from top-level (will re-enable when admin features finalized)
  const [showAdminBooks, setShowAdminBooks] = useState(false);
  const [showAdminUsers, setShowAdminUsers] = useState(false);
  const [showAdminCommunities, setShowAdminCommunities] = useState(false);
  // Ticker to trigger periodic recalculation of rent (every 60s)
  const [rentTick, setRentTick] = useState(0);
  
  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('communityLibraryUsers');
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    }
    
    const savedCurrentUser = localStorage.getItem('communityLibraryCurrentUser');
    if (savedCurrentUser) {
      const userData = JSON.parse(savedCurrentUser);
      setUser(userData);
      setUserCommunity(userData.community);
    }
    
  // NOTE: Older versions used two different keys. Support both.
  const savedBookRequests = localStorage.getItem('communityLibraryRequests') || localStorage.getItem('communityLibraryBookRequests');
    if (savedBookRequests) {
      setBookRequests(JSON.parse(savedBookRequests));
    }
  }, []);

  // Save user data to localStorage whenever allUsers changes
  useEffect(() => {
    if (Object.keys(allUsers).length > 0) {
      localStorage.setItem('communityLibraryUsers', JSON.stringify(allUsers));
    }
  }, [allUsers]);
  
  // Save book requests to localStorage whenever bookRequests changes
  useEffect(() => {
    localStorage.setItem('communityLibraryRequests', JSON.stringify(bookRequests));
    localStorage.setItem('communityLibraryBookRequests', JSON.stringify(bookRequests));
  }, [bookRequests]);

  // Periodic rent refresh (1 minute)
  useEffect(() => {
    const id = setInterval(() => setRentTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Get current user's books
  const getCurrentUserBooks = () => {
    if (!user || !allUsers[user.email]) return [];
    return allUsers[user.email].books || [];
  };

  // Get all books from users in the same community (merge backend + local)
  const getCommunityBooks = () => {
    if (!userCommunity) return [];
    const local = [];
    Object.values(allUsers).forEach(userData => {
      if (userData.community === userCommunity && userData.books) {
        local.push(...userData.books);
      }
    });
    const remote = backendBooks.filter(b => (b.location?.community || b.community) === userCommunity);
    const seen = new Set();
    const merged = [];
    [...remote, ...local].forEach(b => {
      const key = b.barcode || b.id;
      if (!seen.has(key)) { seen.add(key); merged.push(b); }
    });
    return merged;
  };

  // Initial backend fetch
  useEffect(() => {
    (async () => {
      try {
        const items = await fetchBackendBooks();
        setBackendBooks(items);
      } catch (e) {
        setBackendBooksError(e.message);
      } finally {
        setBackendBooksLoaded(true);
      }
    })();
  }, []);
  
  // Calculate rent for borrowed books
  const calculateRent = (borrowDate, dailyRate = 10, maxRentalDays = 14) => {
    if (!borrowDate) return 0;
    const startDate = new Date(borrowDate);
    const currentDate = new Date();
    const daysElapsed = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const withinDays = Math.min(daysElapsed, maxRentalDays);
    const base = withinDays * dailyRate;
    const overdue = Math.max(0, daysElapsed - maxRentalDays);
    if (overdue === 0) return base;
    let penalty = 0;
    const tier1 = Math.min(overdue, 5); // 25%
    penalty += tier1 * dailyRate * 0.25;
    const tier2 = Math.min(Math.max(overdue - 5, 0), 5); // next 5 at 50%
    penalty += tier2 * dailyRate * 0.50;
    const tier3 = Math.max(overdue - 10, 0); // remaining at 100%
    penalty += tier3 * dailyRate * 1.00;
    return Math.round((base + penalty) * 100) / 100; // round to 2 decimals
  };

  // Add book to current user's collection
  const addBookToUser = async (bookData) => {
    if (!user) return;
    // Attempt backend creation first; fall back to local if fails
    setCreatingBook(true); setCreateBookError(null);
    try {
      const payload = {
        title: bookData.title,
        author: bookData.author || 'Unknown',
        barcode: bookData.barcode || (bookData.isbn || (`TEMP-${Date.now()}`)),
        isbn: bookData.isbn || '',
        genre: bookData.genre || 'General',
        description: bookData.description || '',
        rental: { pricePerDay: Number(bookData.price)||0, maxRentalDays: bookData.maxRentalDays||14 },
        location: { community: userCommunity, address: '' }
      };
      const created = await createBook(payload);
      // Refresh list (simplest: refetch)
      try { setBackendBooks(await fetchBackendBooks()); } catch(_){}
      return created;
    } catch (e) {
      setCreateBookError(e.message);
      // Local fallback
      const newBook = {
        ...bookData,
        id: Date.now() + Math.random(),
        owner: user.name,
        ownerEmail: user.email,
        community: userCommunity,
        dateAdded: new Date().toLocaleDateString(),
        earnings: '₹0',
        available: true,
        dailyRate: Number(bookData.price) || 0,
        maxRentalDays: bookData.maxRentalDays || 14,
        price: bookData.price || '₹10/day'
      };
      setAllUsers(prev => ({
        ...prev,
        [user.email]: {
          ...prev[user.email],
          books: [...(prev[user.email]?.books || []), newBook]
        }
      }));
      return newBook;
    } finally { setCreatingBook(false); }
  };
  
  // Request a book from another user
  const requestBook = async (book) => {
    if (!user) {
      alert('Please log in to request books');
      navigate('login');
      return false;
    }
    
    // Check if book is available
    if (!book.available) {
      alert('Sorry, this book is not available for borrowing at the moment.');
      return false;
    }
    
    // Check if the user is requesting their own book
    if (book.ownerEmail === user.email) {
      alert('You cannot request your own book.');
      return false;
    }
    
    // Check if the user has already requested this book
    if (bookRequests[book.ownerEmail] && 
        bookRequests[book.ownerEmail][book.id] && 
        bookRequests[book.ownerEmail][book.id].requesterEmail === user.email) {
      alert('You have already requested this book.');
      return false;
    }
    
    // Try backend first
    let backendRequestId = null;
    try {
      // naive rental window: today to +7 days
      const start = new Date();
      const end = new Date(Date.now() + 7*24*3600*1000);
      const created = await createRequest({ bookId: book._id || book.id, startDate: start, endDate: end });
      backendRequestId = created._id;
    } catch (e) {
      console.warn('Backend request create failed, falling back to local:', e.message);
    }

    const newRequest = {
      requesterName: user.name,
      requesterEmail: user.email,
      requestDate: new Date().toISOString(),
      status: 'pending',
      message: `Hello, I would like to borrow "${book.title}" by ${book.author}.`,
      requestId: backendRequestId || `LOCAL-${Date.now()}`,
      bookId: book._id || book.id
    };

    const updatedRequests = { ...bookRequests };
    if (!updatedRequests[book.ownerEmail]) updatedRequests[book.ownerEmail] = {};
    updatedRequests[book.ownerEmail][book.id] = newRequest;
    setBookRequests(updatedRequests);
    localStorage.setItem('communityLibraryRequests', JSON.stringify(updatedRequests));

    alert(`Request sent for "${book.title}"${backendRequestId ? '' : ' (stored locally)'}.`);
    return true;
  };
  
  // Complete checkout for a book request
  const completeCheckout = async (bookId, requesterId) => {
    if (!user || bookId == null || !requesterId) return false;
    
    // Get the current user's books
    const userEmail = user.email;
    const userBooks = allUsers[userEmail]?.books;
    if (!userBooks) return false;
    
    // Find the book and update its status
  const bookIndex = userBooks.findIndex(book => String(book.id) === String(bookId));
    if (bookIndex === -1) return false;
    
  // Get requester info from requests
  const requesterRequest = bookRequests[userEmail]?.[bookId];
    if (!requesterRequest) return false;
    
    // Update book status in user's collection
    const updatedUserBooks = [...userBooks];
    updatedUserBooks[bookIndex] = {
      ...updatedUserBooks[bookIndex],
      available: false,
      status: 'borrowed',
      borrower: requesterRequest.requesterName,
      borrowerEmail: requesterRequest.requesterEmail,
      borrowDate: new Date().toISOString(),
      rentPerDay: updatedUserBooks[bookIndex].dailyRate || 10
    };
    
    // Update allUsers state (use functional form then persist inside callback to avoid stale write)
    setAllUsers(prev => {
      const next = {
        ...prev,
        [userEmail]: {
          ...prev[userEmail],
          books: updatedUserBooks
        }
      };
      localStorage.setItem('communityLibraryUsers', JSON.stringify(next));
      return next;
    });
    
    // Update request status
    const updatedRequests = { ...bookRequests };
    if (!updatedRequests[userEmail]) {
      updatedRequests[userEmail] = {};
    }
    
    // Try backend approval if we have backend request id
    if (requesterRequest.requestId && !requesterRequest.requestId.startsWith('LOCAL-')) {
      try {
        await approveRequest(requesterRequest.requestId);
      } catch (e) {
        console.warn('Backend approve failed, continuing local:', e.message);
      }
    }

    updatedRequests[userEmail][bookId] = {
      ...requesterRequest,
      status: 'borrowed',
      checkoutDate: new Date().toISOString(),
      approvalDate: new Date().toISOString()
    };
    
  setBookRequests(updatedRequests);
  localStorage.setItem('communityLibraryRequests', JSON.stringify(updatedRequests));

  // Borrower notification (lightweight local implementation)
  try {
    const notificationsRaw = localStorage.getItem('communityLibraryNotifications');
    const notifications = notificationsRaw ? JSON.parse(notificationsRaw) : {};
    if (!notifications[requesterRequest.requesterEmail]) notifications[requesterRequest.requesterEmail] = [];
    notifications[requesterRequest.requesterEmail].push({
      type: 'checkout-approved',
      bookTitle: updatedUserBooks[bookIndex].title,
      owner: user.name,
      date: new Date().toISOString(),
      message: `Your checkout for "${updatedUserBooks[bookIndex].title}" was approved. You can now pick up / have picked up the book.`,
      read: false
    });
    localStorage.setItem('communityLibraryNotifications', JSON.stringify(notifications));
  } catch (_) {}

    alert(`Checkout completed for ${updatedUserBooks[bookIndex].title}. The borrower has been notified.`);
    return true;
  };
  
  // Complete return for a borrowed book
  const completeReturn = async (bookId) => {
    if (!user || !bookId) return false;
    
    // Get the current user's books
    const userEmail = user.email;
    const userBooks = allUsers[userEmail]?.books;
    if (!userBooks) return false;
    
    // Find the book and update its status
    const bookIndex = userBooks.findIndex(book => book.id === bookId);
    if (bookIndex === -1) return false;
    
    const book = userBooks[bookIndex];
    if (!book.borrowerEmail) return false;
    
    // Calculate earnings from this rental
    const rentalDays = calculateRent(book.borrowDate, book.dailyRate) / book.dailyRate;
    const earnings = rentalDays * book.dailyRate;
    const previousEarnings = parseInt(book.earnings.replace('₹', '')) || 0;
    const totalEarnings = previousEarnings + earnings;
    
    // Update book status in user's collection
    const updatedUserBooks = [...userBooks];
    updatedUserBooks[bookIndex] = {
      ...updatedUserBooks[bookIndex],
      available: true,
      status: 'available',
      borrower: null,
      borrowerEmail: null,
      returnDate: new Date().toISOString(),
      earnings: `₹${totalEarnings}`
    };
    
    // Update allUsers state
    setAllUsers(prev => ({
      ...prev,
      [userEmail]: {
        ...prev[userEmail],
        books: updatedUserBooks
      }
    }));
    
    // Update request status
    const updatedRequests = { ...bookRequests };
    if (updatedRequests[userEmail] && updatedRequests[userEmail][bookId]) {
      const reqObj = updatedRequests[userEmail][bookId];
      if (reqObj.requestId && !reqObj.requestId.startsWith('LOCAL-')) {
        try { await returnRequest(reqObj.requestId); } catch(e){ console.warn('Backend return failed, keeping local:', e.message); }
      }
      updatedRequests[userEmail][bookId] = {
        ...reqObj,
        status: 'completed',
        returnDate: new Date().toISOString()
      };
      setBookRequests(updatedRequests);
      localStorage.setItem('communityLibraryRequests', JSON.stringify(updatedRequests));
    }

    // Notify borrower of return completion
    try {
      const borrowerEmail = book.borrowerEmail;
      if (borrowerEmail) {
        const notificationsRaw = localStorage.getItem('communityLibraryNotifications');
        const notifications = notificationsRaw ? JSON.parse(notificationsRaw) : {};
        if (!notifications[borrowerEmail]) notifications[borrowerEmail] = [];
        notifications[borrowerEmail].push({
          type: 'return-completed',
          bookTitle: book.title,
            owner: user.name,
          date: new Date().toISOString(),
          message: `Return recorded for "${book.title}". Thank you!`,
          read: false
        });
        localStorage.setItem('communityLibraryNotifications', JSON.stringify(notifications));
      }
    } catch (_) {}
    
    return true;
  };

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const Header = () => {
    // Calculate number of pending requests for the current user
    const getPendingRequestsCount = () => {
      if (!user || !user.email) return 0;
      
      const userEmail = user.email;
      const userRequests = bookRequests[userEmail] || {};
      
      let count = 0;
      Object.values(userRequests).forEach(request => {
        if (request.status === 'pending') {
          count++;
        }
      });
      
      return count;
    };
    
    const pendingCount = getPendingRequestsCount();
    // Borrower unread notifications count
    let borrowerNotificationCount = 0;
    try {
      if (user?.email) {
        const notificationsRaw = localStorage.getItem('communityLibraryNotifications');
        if (notificationsRaw) {
          const notifications = JSON.parse(notificationsRaw);
          borrowerNotificationCount = (notifications[user.email] || []).filter(n => !n.read).length;
        }
      }
    } catch (_) {}
    
    return (
      <header style={{
        backgroundColor: "#2E7D32",
        color: "white",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ margin: 0, cursor: "pointer", display:'flex', alignItems:'center', gap:'8px', fontFamily:'Segoe UI, sans-serif', letterSpacing:'0.5px' }} onClick={() => navigate("home")}>
          <span style={{
            display:'inline-flex',
            width:40,height:40,justifyContent:'center',alignItems:'center',
            background:'linear-gradient(135deg,#2E7D32,#66BB6A)',
            borderRadius:'8px',fontSize:'1.2rem',fontWeight:'bold'
          }}>CL</span>
          <span style={{fontWeight:'600'}}>ComLib</span>
        </h1>
        <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <button 
            onClick={() => navigate("home")}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1rem" }}
          >
            Home
          </button>
          <button 
            onClick={() => navigate("books")}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1rem" }}
          >
            Books
          </button>
          <div style={{ position: 'relative', display:'flex', alignItems:'center', gap:'12px' }}>
            <button 
              onClick={() => navigate("dashboard")}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1rem" }}
            >
              Dashboard
            </button>
            {user && pendingCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                backgroundColor: '#FF9800',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {pendingCount}
              </span>
            )}
            {user && borrowerNotificationCount > 0 && (
              <span title="New updates" style={{
                backgroundColor: '#1976D2',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight:'bold'
              }}>{borrowerNotificationCount} 🔔</span>
            )}
          </div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span>Welcome, {user.name}!</span>
              <button 
                onClick={() => { 
                  setUser(null); 
                  setUserCommunity(null);
                  localStorage.removeItem('communityLibraryCurrentUser');
                  navigate("home"); 
                }}
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.2)", 
                  border: "1px solid white", 
                  color: "white", 
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate("login")}
              style={{ 
                backgroundColor: "rgba(255,255,255,0.2)", 
                border: "1px solid white", 
                color: "white", 
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Login
            </button>
          )}
        </nav>
      </header>
    );
  };

  const HomePage = () => (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <section style={{ textAlign: "center", marginBottom: "60px" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "20px", color: "#333" }}>
          Welcome to ComLib
        </h2>
        <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "30px" }}>
          Share books, build connections, and discover your next great read in your local community.
        </p>
        <div>
          <button 
            onClick={() => navigate("register")}
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "12px 24px",
              fontSize: "1rem",
              borderRadius: "4px",
              marginRight: "10px",
              cursor: "pointer"
            }}>
            Join Now
          </button>
          <button 
            onClick={() => navigate("books")}
            style={{
              backgroundColor: "transparent",
              color: "#2E7D32",
              border: "2px solid #2E7D32",
              padding: "12px 24px",
              fontSize: "1rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
            Browse Books
          </button>
        </div>
      </section>

      <section style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "30px", 
        marginBottom: "60px" 
      }}>
        <div style={{ 
          padding: "30px", 
          backgroundColor: "white", 
          borderRadius: "8px", 
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#2E7D32", marginBottom: "15px" }}>📖 Discover Books</h3>
          <p>Browse thousands of books available in your community</p>
          <button 
            onClick={() => navigate("books")}
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            Explore Now
          </button>
        </div>
        <div style={{ 
          padding: "30px", 
          backgroundColor: "white", 
          borderRadius: "8px", 
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#2E7D32", marginBottom: "15px" }}>🤝 Share & Lend</h3>
          <p>List your books and help others discover great reads</p>
          <button 
            onClick={() => navigate(user ? "dashboard" : "login")}
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            Get Started
          </button>
        </div>
        <div style={{ 
          padding: "30px", 
          backgroundColor: "white", 
          borderRadius: "8px", 
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#2E7D32", marginBottom: "15px" }}>💱 Digital Wallet</h3>
          <p>Secure transactions with our built-in wallet system</p>
          <button 
            onClick={() => navigate(user ? "dashboard" : "login")}
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            Learn More
          </button>
        </div>
      </section>

      <section style={{
        textAlign: "center",
        padding: "40px",
        backgroundColor: "#f0f7f0",
        borderRadius: "8px"
      }}>
        <h3 style={{ marginBottom: "20px", color: "#333" }}>
          Ready to Start Your Library Journey?
        </h3>
        <p style={{ marginBottom: "30px", color: "#666" }}>
          Join thousands of book lovers in your community. Share your books, discover new titles.
        </p>
        <button 
          onClick={() => navigate("register")}
          style={{
            backgroundColor: "#2E7D32",
            color: "white",
            border: "none",
            padding: "15px 30px",
            fontSize: "1.1rem",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
          Get Started Today
        </button>
      </section>
    </div>
  );

  const BooksPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddBook, setShowAddBook] = useState(false);
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    
  // Only use real community books persisted by users
  const communityBooks = getCommunityBooks();
  const allCommunityBooks = communityBooks.filter(book => !userCommunity || book.community === userCommunity);

    const filteredBooks = allCommunityBooks.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const backendStatusBanner = !backendBooksLoaded ? (
      <div style={{padding:'6px 12px', background:'#fff3cd', border:'1px solid #ffe58f', borderRadius:4, marginBottom:12, fontSize:12}}>Loading books from server...</div>
    ) : backendBooksError ? (
      <div style={{padding:'6px 12px', background:'#fdecea', border:'1px solid #f5c2c7', borderRadius:4, marginBottom:12, fontSize:12}}>Server books unavailable ({backendBooksError}). Showing local only.</div>
    ) : null;

    const AddBookForm = () => {
      const [bookData, setBookData] = useState({
        title: '',
        author: '',
        isbn: '',
        condition: 'good',
        price: '',
  maxRentalDays: 14,
  description: '',
  imageUrl: ''
      });
      const [isScanning, setIsScanning] = useState(false);
      const [isLoadingBookData, setIsLoadingBookData] = useState(false);

      // Function to fetch book data from Google Books API
      const fetchBookFromGoogle = async (isbn) => {
        try {
          setIsLoadingBookData(true);
          const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            setBookData(prev => ({
              ...prev,
              title: book.title || '',
              author: book.authors ? book.authors.join(', ') : '',
              description: book.description || '',
              imageUrl: book.imageLinks ? book.imageLinks.thumbnail : ''
            }));
            alert('Book information loaded successfully!');
          } else {
            alert('Book not found in Google Books database. Please enter details manually.');
          }
        } catch (error) {
          console.error('Error fetching book data:', error);
          alert('Error fetching book data. Please enter details manually.');
        } finally {
          setIsLoadingBookData(false);
        }
      };

      // Function to handle ISBN input and auto-fetch
      const handleISBNChange = (e) => {
        const isbn = e.target.value;
        setBookData(prev => ({ ...prev, isbn }));
        
        // Auto-fetch when ISBN is complete (10 or 13 digits)
        if (isbn.length === 10 || isbn.length === 13) {
          fetchBookFromGoogle(isbn);
        }
      };

      // Simulated barcode scanner (in real app, you'd use a camera library)
      const startBarcodeScanner = () => {
        setIsScanning(true);
        // Simulate scanning process
        setTimeout(() => {
          const mockISBN = '9780134685991'; // Example ISBN
          setBookData(prev => ({ ...prev, isbn: mockISBN }));
          fetchBookFromGoogle(mockISBN);
          setIsScanning(false);
          alert('Barcode scanned successfully! ISBN: ' + mockISBN);
        }, 2000);
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        const newBookData = {
          title: bookData.title,
          author: bookData.author,
          isbn: bookData.isbn,
          condition: bookData.condition,
          price: `₹${bookData.price}/day`,
          description: bookData.description,
          imageUrl: bookData.imageUrl
        };
        
        // Add book to user's collection using the new function
        addBookToUser(newBookData);
        
        alert(`Book "${bookData.title}" added successfully to your collection!`);
        setShowAddBook(false);
        setBookData({ title: '', author: '', isbn: '', condition: 'good', price: '', description: '', imageUrl: '' });
      };

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>Add New Book</h3>
              <button
                onClick={() => setShowAddBook(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                placeholder="Book Title *"
                value={bookData.title}
                onChange={(e) => setBookData(prev => ({ ...prev, title: e.target.value }))}
                style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              
              {/* ISBN Section with Barcode Scanner */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontWeight: 'bold', color: '#333' }}>ISBN & Book Information</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="ISBN (10 or 13 digits)"
                    value={bookData.isbn}
                    onChange={handleISBNChange}
                    style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      flex: 1
                    }}
                  />
                  <button
                    type="button"
                    onClick={startBarcodeScanner}
                    disabled={isScanning}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: isScanning ? '#ccc' : '#2E7D32',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isScanning ? 'not-allowed' : 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    {isScanning ? '📷 Scanning...' : '📷 Scan ISBN'}
                  </button>
                </div>
                {isLoadingBookData && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#2E7D32', 
                    fontSize: '0.9rem',
                    padding: '10px',
                    backgroundColor: '#f0f8f0',
                    borderRadius: '4px'
                  }}>
                    📚 Loading book information from Google Books...
                  </div>
                )}
                {bookData.imageUrl && (
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <img 
                      src={bookData.imageUrl} 
                      alt={bookData.title}
                      style={{ 
                        maxWidth: '120px', 
                        maxHeight: '180px', 
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Author *"
                value={bookData.author}
                onChange={(e) => setBookData(prev => ({ ...prev, author: e.target.value }))}
                style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <select
                value={bookData.condition}
                onChange={(e) => setBookData(prev => ({ ...prev, condition: e.target.value }))}
                style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              <input
                type="number"
                placeholder="Daily Rent (₹) *"
                value={bookData.price}
                onChange={(e) => setBookData(prev => ({ ...prev, price: e.target.value }))}
                style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
                min="1"
              />
              <textarea
                placeholder="Description (optional)"
                value={bookData.description}
                onChange={(e) => setBookData(prev => ({ ...prev, description: e.target.value }))}
                style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddBook(false)}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

    // Bulk Add Books Form Component
    const BulkAddForm = () => {
      const [bulkBooks, setBulkBooks] = useState('');
      const [isProcessing, setIsProcessing] = useState(false);
      const [processedBooks, setProcessedBooks] = useState([]);

      const processBulkBooks = async () => {
        setIsProcessing(true);
        const bookLines = bulkBooks.split('\n').filter(line => line.trim());
        const processed = [];

        for (let line of bookLines) {
          const parts = line.split(',').map(part => part.trim());
          if (parts.length >= 2) {
            const [title, author, isbn = '', price = '50'] = parts;
            
            let bookData = {
              title,
              author,
              isbn,
              price: price.replace(/[₹]/g, ''),
              imageUrl: '',
              condition: 'good',
              description: ''
            };

            // Try to fetch from Google Books if ISBN is provided
            if (isbn && (isbn.length === 10 || isbn.length === 13)) {
              try {
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
                const data = await response.json();
                
                if (data.items && data.items.length > 0) {
                  const book = data.items[0].volumeInfo;
                  bookData.imageUrl = book.imageLinks ? book.imageLinks.thumbnail : '';
                  bookData.description = book.description || '';
                }
              } catch (error) {
                console.error('Error fetching book data for ISBN:', isbn, error);
              }
            }

            processed.push(bookData);
          }
        }
        
        setProcessedBooks(processed);
        setIsProcessing(false);
      };

      const addAllBooks = () => {
        processedBooks.forEach(bookData => {
          const bookWithPrice = {
            ...bookData,
            price: `₹${bookData.price}/day`
          };
          addBookToUser(bookWithPrice);
        });
        
        alert(`Successfully added ${processedBooks.length} books to your collection!`);
        setShowBulkAdd(false);
        setBulkBooks('');
        setProcessedBooks([]);
      };

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>Bulk Add Books</h3>
              <button
                onClick={() => setShowBulkAdd(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>Instructions:</h4>
              <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                Enter one book per line in the following format:<br/>
                <strong>Title, Author, ISBN (optional), Price per day (optional)</strong><br/>
                Example: "The Great Gatsby, F. Scott Fitzgerald, 9780743273565, 45"
              </p>
            </div>

            <textarea
              value={bulkBooks}
              onChange={(e) => setBulkBooks(e.target.value)}
              placeholder="Enter books (one per line):&#10;The Great Gatsby, F. Scott Fitzgerald, 9780743273565, 45&#10;To Kill a Mockingbird, Harper Lee, , 50&#10;1984, George Orwell, 9780451524935"
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={processBulkBooks}
                disabled={!bulkBooks.trim() || isProcessing}
                style={{
                  backgroundColor: isProcessing ? '#ccc' : '#1976D2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isProcessing ? '🔄 Processing...' : '📖 Preview Books'}
              </button>
              
              {processedBooks.length > 0 && (
                <button
                  onClick={addAllBooks}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ✅ Add All ({processedBooks.length}) Books
                </button>
              )}
            </div>

            {processedBooks.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#333' }}>Preview ({processedBooks.length} books):</h4>
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  padding: '10px'
                }}>
                  {processedBooks.map((book, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      padding: '10px', 
                      borderBottom: index < processedBooks.length - 1 ? '1px solid #eee' : 'none',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      {book.imageUrl && (
                        <img 
                          src={book.imageUrl} 
                          alt={book.title}
                          style={{ 
                            width: '40px', 
                            height: '60px', 
                            objectFit: 'cover',
                            borderRadius: '2px'
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <strong>{book.title}</strong> by {book.author}
                        {book.isbn && <div style={{ fontSize: '0.8rem', color: '#666' }}>ISBN: {book.isbn}</div>}
                        <div style={{ fontSize: '0.9rem', color: '#2E7D32' }}>₹{book.price}/day</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: "2rem", margin: 0, color: "#333" }}>
            Available Books {userCommunity && `- ${userCommunity}`}
          </h2>
          {user && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAddBook(true)}
                style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                + Add Book
              </button>
              <button
                onClick={() => setShowBulkAdd(true)}
                style={{
                  backgroundColor: '#1976D2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                📚 Bulk Add
              </button>
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: "30px" }}>
          <input
            type="text"
            placeholder="Search books or authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "12px",
              fontSize: "1rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        {!user && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#856404' }}>
              📚 Showing books from Aparna Sarovar Zenith (Demo). Please{' '}
              <button 
                onClick={() => navigate('login')}
                style={{ background: 'none', border: 'none', color: '#2E7D32', textDecoration: 'underline', cursor: 'pointer' }}
              >
                login
              </button>
              {' '}to see books from your community.
            </p>
          </div>
        )}

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "20px" 
        }}>
          {filteredBooks.map(book => (
            <div key={book.id} style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              backgroundColor: book.available ? "white" : "#f5f5f5",
              display: "flex",
              flexDirection: "column"
            }}>
              {book.imageUrl && (
                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <img 
                    src={book.imageUrl} 
                    alt={book.title}
                    style={{ 
                      maxWidth: "120px", 
                      maxHeight: "180px", 
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
              <h3 style={{ color: "#333", marginBottom: "10px" }}>{book.title}</h3>
              <p style={{ color: "#666", marginBottom: "8px" }}>by {book.author}</p>
              <p style={{ color: "#666", marginBottom: "8px", fontSize: "0.9rem" }}>Owner: {book.owner}</p>
              <p style={{ color: "#666", marginBottom: "8px", fontSize: "0.9rem" }}>Community: {book.community}</p>
              {book.isbn && <p style={{ color: "#666", marginBottom: "10px", fontSize: "0.8rem" }}>ISBN: {book.isbn}</p>}
              <p style={{ color: "#2E7D32", fontWeight: "bold", marginBottom: "15px" }}>{book.price}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                <span style={{
                  color: book.available ? "#2E7D32" : "#d32f2f",
                  fontWeight: "bold"
                }}>
                  {book.available ? "✅ Available" : "❌ Borrowed"}
                </span>
                <button
                  onClick={() => {
                    if (user) {
                      // Don't allow users to request their own books
                      if (book.ownerEmail === user.email) {
                        alert("You can't request your own book. This is your book!");
                        return;
                      }
                      
                      // Check if the book is already borrowed
                      if (!book.available) {
                        alert("Sorry, this book is currently not available for borrowing.");
                        return;
                      }
                      
                      // Check if there's already a pending request for this book
                      const existingRequest = bookRequests[book.ownerEmail]?.[book.id];
                      if (existingRequest && existingRequest.requesterEmail === user.email && existingRequest.status === 'pending') {
                        alert("You already have a pending request for this book.");
                        return;
                      }
                      
                      // Make the request
                      requestBook(book);
                    } else {
                      navigate("login");
                    }
                  }}
                  style={{
                    backgroundColor: book.available ? "#2E7D32" : "#ccc",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: book.available ? "pointer" : "not-allowed",
                    fontSize: "0.9rem"
                  }}
                  disabled={!book.available}
                >
                  {book.available ? "Request Book" : "Not Available"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No books found matching your search criteria.</p>
          </div>
        )}

        {showAddBook && <AddBookForm />}
        {showBulkAdd && <BulkAddForm />}
      </div>
    );
  };

  const DashboardPage = () => {
    const BorrowedBooksModal = () => {
      // Find books borrowed by the current user
      const userEmail = user?.email;
      const borrowedBooks = [];
      
      // Check all users' books to find ones borrowed by current user
      Object.values(allUsers).forEach(userData => {
        if (userData.books) {
          userData.books.forEach(book => {
            if (book.borrowerEmail === userEmail) {
              // Calculate current rent
              const currentRent = calculateRent(book.borrowDate, book.dailyRate, book.maxRentalDays || 14);
              const borrowDate = new Date(book.borrowDate);
              const dueDate = new Date(borrowDate.getTime() + (book.maxRentalDays || 14)*24*60*60*1000);
              const today = new Date();
              const daysLeft = Math.ceil((dueDate - today)/(1000*60*60*24));
              const overdueDays = daysLeft < 0 ? Math.abs(daysLeft) : 0;
              let penaltyMultiplier = 0;
              if (overdueDays>0){
                if (overdueDays <=5) penaltyMultiplier = 0.25; else if (overdueDays<=10) penaltyMultiplier = 0.50; else penaltyMultiplier = 1.00;
              }
              borrowedBooks.push({
                ...book,
                currentRent,
                dueDate: dueDate.toISOString(),
                daysLeft,
                overdueDays,
                penaltyMultiplier
              });
            }
          });
        }
      });
      
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>Books I've Borrowed</h3>
              <button
                onClick={() => setShowBorrowedBooks(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            {borrowedBooks.length > 0 && (
              <div style={{
                backgroundColor:'#FFF3E0',
                border:'1px solid #FF9800',
                padding:'15px',
                borderRadius:'8px',
                marginBottom:'20px',
                display:'flex',
                justifyContent:'space-between',
                flexWrap:'wrap'
              }}>
                <div style={{marginRight:'20px'}}>
                  <p style={{margin:'0 0 4px 0', fontSize:'0.8rem', color:'#666'}}>TOTAL OWED NOW</p>
                  <p style={{margin:0, fontSize:'1.8rem', fontWeight:'bold', color:'#FF9800'}}>₹{borrowedBooks.reduce((s,b)=> s + (b.currentRent||0),0)}</p>
                </div>
                <div style={{marginRight:'20px'}}>
                  <p style={{margin:'0 0 4px 0', fontSize:'0.8rem', color:'#666'}}>ACTIVE RENTALS</p>
                  <p style={{margin:0, fontSize:'1.4rem', fontWeight:'bold'}}>{borrowedBooks.length}</p>
                </div>
                <div style={{flex:'1 1 100%', marginTop:'10px', fontSize:'0.8rem', color:'#555'}}>
                  Rent accrues daily until the owner marks a return. Pay the owner directly when returning.
                </div>
              </div>
            )}

            {borrowedBooks.length === 0 ? (
              <div style={{ 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>You haven't borrowed any books yet.</p>
                <button
                  onClick={() => {
                    setShowBorrowedBooks(false);
                    navigate('books');
                  }}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '15px'
                  }}
                >
                  Browse Books to Borrow
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {borrowedBooks.map((book, index) => (
                  <div key={index} style={{
                    border: '1px solid #FF9800',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: '#FFF8E1'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{book.title}</h4>
                        <p style={{ margin: '0 0 8px 0', color: '#666' }}>by {book.author}</p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: '#666' }}>Owner:</span> <span style={{ fontWeight: 'bold' }}>{book.owner}</span>
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: '#666' }}>Borrowed on:</span> <span style={{ fontWeight: 'bold' }}>{new Date(book.borrowDate).toLocaleDateString()}</span>
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: '#666' }}>Rate:</span> <span style={{ fontWeight: 'bold', color: '#2E7D32' }}>{book.price}</span>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          backgroundColor: '#FF9800', 
                          color: 'white', 
                          padding: '10px 15px', 
                          borderRadius: '8px',
                          marginBottom: '10px'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem' }}>CURRENT DUE</p>
                          <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold' }}>₹{book.currentRent}</p>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0' }}>
                          {Math.ceil(book.currentRent / book.dailyRate)} days × ₹{book.dailyRate}/day
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div style={{ 
                  backgroundColor: '#E8F5E9', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #2E7D32',
                  marginTop: '20px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>Payment Instructions</h4>
                  <p style={{ fontSize: '0.9rem', margin: '0 0 8px 0' }}>
                    Please pay the rent amount directly to the book owner when returning the book.
                  </p>
                  <p style={{ fontSize: '0.9rem', margin: '0' }}>
                    <strong>Note:</strong> The rent continues to accumulate until the book is marked as returned by the owner.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };
    
    const [showMyBooks, setShowMyBooks] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpAction, setOtpAction] = useState(null);
    const [otpData, setOtpData] = useState(null);
    const [otp, setOtp] = useState('');
  // Removed duplicate state declarations (using top-level state instead)
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      block: user?.block || '',
      apartment: user?.apartment || ''
    });

    // Get all user books
    const allUserBooks = Object.values(allUsers).flatMap(userData => userData.books || []);
  const allBooksForAdmin = allUserBooks; // Only real user books

    const communities = [
      "Aparna Sarovar Zenith",
      "Aparna Sarovar", 
      "Aparna Cyberzon"
    ];

    if (!user) {
      return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2>Access Restricted</h2>
          <p>Please log in to view your dashboard.</p>
          <button 
            onClick={() => navigate("login")}
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            Go to Login
          </button>
        </div>
      );
    }

    // Get current user's books
    const currentUserBooks = getCurrentUserBooks();
  const allMyBooks = currentUserBooks; // Only actual user's books

    const handleOtpVerification = () => {
      if (otp === '1234') {
        if (otpAction === 'delete') {
          // Remove book from current user's collection
          setAllUsers(prev => ({
            ...prev,
            [user.email]: {
              ...prev[user.email],
              books: prev[user.email].books.filter(book => book.id !== otpData.bookId)
            }
          }));
          alert(`${otpData.bookTitle} removed from collection`);
        } else if (otpAction === 'wallet') {
          alert("Wallet transaction completed successfully!");
        } else if (typeof otpAction === 'function') {
          // Execute the function (for profile updates)
          otpAction();
          return; // Return early as the function handles its own cleanup
        }
        setShowOtpModal(false);
        setOtp('');
        setOtpAction(null);
        setOtpData(null);
      } else {
        alert('Invalid OTP! Please try again. (Use 1234 for demo)');
      }
    };

    const requestOtpAction = (action, data) => {
      setOtpAction(action);
      setOtpData(data);
      setShowOtpModal(true);
      alert('OTP sent to your mobile number for security verification!');
    };

    const OtpModal = () => (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>
            Security Verification Required
          </h3>
          <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
            OTP sent to {user.mobile || '+91XXXXXXXXXX'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                textAlign: 'center',
                letterSpacing: '2px'
              }}
              maxLength="6"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtp('');
                  setOtpAction(null);
                  setOtpData(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleOtpVerification}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Verify
              </button>
            </div>
          </div>
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #2E7D32',
            borderRadius: '4px',
            padding: '10px',
            marginTop: '15px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2E7D32' }}>
              <strong>Demo:</strong> Use OTP <strong>123456</strong> to verify
            </p>
          </div>
        </div>
      </div>
    );

    const MyBooksModal = () => {
      // Get book requests for current user's books
      const userEmail = user?.email;
      const userRequests = bookRequests[userEmail] || {};
      
      // Filter for pending requests
      const pendingRequests = [];
      Object.entries(userRequests).forEach(([bookId, request]) => {
        if (request.status === 'pending') {
          // Find the book details
          const book = allMyBooks.find(b => b.id == bookId);
          if (book) {
            pendingRequests.push({
              ...request,
              bookId,
              book
            });
          }
        }
      });
      
      // Filter for borrowed books
      const borrowedBooks = [];
      Object.entries(userRequests).forEach(([bookId, request]) => {
        if (request.status === 'borrowed') {
          // Find the book details
          const book = allMyBooks.find(b => b.id == bookId);
          if (book) {
            const currentRent = calculateRent(book.borrowDate, book.dailyRate, book.maxRentalDays || 14);
            const borrowDate = new Date(book.borrowDate);
            const dueDate = new Date(borrowDate.getTime() + (book.maxRentalDays || 14)*24*60*60*1000);
            const today = new Date();
            const daysLeft = Math.ceil((dueDate - today)/(1000*60*60*24));
            const overdueDays = daysLeft < 0 ? Math.abs(daysLeft) : 0;
            let penaltyMultiplier = 0;
            if (overdueDays>0){
              if (overdueDays <=5) penaltyMultiplier = 0.25; else if (overdueDays<=10) penaltyMultiplier = 0.50; else penaltyMultiplier = 1.00;
            }
            borrowedBooks.push({
              ...request,
              bookId,
              book,
              currentRent,
              dueDate: dueDate.toISOString(),
              daysLeft,
              overdueDays,
              penaltyMultiplier
            });
          }
        }
      });
      
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>My Books Collection</h3>
              <button
                onClick={() => setShowMyBooks(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ borderBottom: '2px solid #FF9800', paddingBottom: '8px', color: '#FF9800' }}>
                  Book Requests Received ({pendingRequests.length})
                </h4>
                
                <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                  {pendingRequests.map((requestData, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #FF9800', 
                      borderRadius: '8px', 
                      padding: '15px',
                      backgroundColor: '#FFF8E1'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{requestData.book?.title}</h4>
                          <p style={{ margin: '0 0 5px 0', color: '#666' }}>by {requestData.book?.author}</p>
                          <p style={{ margin: '0 0 5px 0', color: '#FF9800', fontWeight: 'bold' }}>
                            Requested by: {requestData.requesterName}
                          </p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#999' }}>
                            Requested on: {new Date(requestData.requestDate).toLocaleDateString()}
                          </p>
                          <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                            Message: {requestData.message || 'No message provided'}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => {
                              const success = completeCheckout(requestData.bookId, requestData.requesterEmail);
                            if (success) {
                              alert(`Checkout complete! "${requestData.book.title}" is now borrowed by ${requestData.requesterName}.`);
                            } else {
                              alert('Error processing checkout. Please try again.');
                            }
                          }}
                          style={{
                            backgroundColor: '#FF9800',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}
                        >
                          Complete Checkout
                        </button>
                        
                        <button
                          onClick={() => {
                            // Reject request logic
                            const updatedRequests = { ...bookRequests };
                            updatedRequests[userEmail][requestData.bookId] = {
                              ...requestData,
                              status: 'rejected',
                              responseDate: new Date().toISOString()
                            };
                            setBookRequests(updatedRequests);
                            alert(`Request for "${requestData.book.title}" was rejected.`);
                          }}
                          style={{
                            backgroundColor: '#F44336',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Reject Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {borrowedBooks.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ borderBottom: '2px solid #2E7D32', paddingBottom: '8px', color: '#2E7D32' }}>
                  Books Currently Borrowed ({borrowedBooks.length})
                </h4>
                
                <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                  {borrowedBooks.map((borrowData, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #2E7D32', 
                      borderRadius: '8px', 
                      padding: '15px',
                      backgroundColor: '#E8F5E9'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{borrowData.book?.title}</h4>
                          <p style={{ margin: '0 0 5px 0', color: '#666' }}>by {borrowData.book?.author}</p>
                          <p style={{ margin: '0 0 5px 0', color: '#2E7D32', fontWeight: 'bold' }}>
                            Borrowed by: {borrowData.requesterName}
                          </p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#555' }}>
                            Checkout: {borrowData.borrowDate ? new Date(borrowData.borrowDate).toLocaleDateString(): '-'} | Due: {borrowData.dueDate ? new Date(borrowData.dueDate).toLocaleDateString(): '-'}
                          </p>
                          {borrowData.daysLeft >= 0 ? (
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: borrowData.daysLeft <=2 ? '#FF9800':'#2E7D32', fontWeight: borrowData.daysLeft <=2 ? 'bold':'normal' }}>
                              {borrowData.daysLeft} day(s) left
                            </p>
                          ) : (
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color:'#D32F2F', fontWeight:'bold' }}>
                              Overdue by {borrowData.overdueDays} day(s) • Penalty rate {Math.round(borrowData.penaltyMultiplier*100)}%
                            </p>
                          )}
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: borrowData.overdueDays>0? '#D32F2F':'#333' }}>
                            Current Rent: ₹{borrowData.currentRent}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => {
                            const confirmReturn = window.confirm(
                              `Mark "${borrowData.book.title}" as returned by ${borrowData.requesterName}?\n\n` +
                              "IMPORTANT: Only click 'OK' when:\n" +
                              "1. The borrower has physically returned the book\n" +
                              "2. You have verified the book's condition\n" +
                              "3. You have collected any applicable rent: ₹" + borrowData.currentRent
                            );
                            
                            if (confirmReturn) {
                              const success = completeReturn(borrowData.bookId);
                              if (success) {
                                alert(`Return complete! "${borrowData.book.title}" is now available again. Earnings added to your account.`);
                              } else {
                                alert('Error processing return. Please try again.');
                              }
                            }
                          }}
                          style={{
                            backgroundColor: '#2E7D32',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}
                        >
                          Complete Return
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {allMyBooks.map(book => (
                <div key={book.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: book.status === 'available' ? '#f8fff8' : '#fff8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{book.title}</h4>
                      <p style={{ margin: '0 0 5px 0', color: '#666' }}>by {book.author}</p>
                      <p style={{ margin: '0 0 5px 0', color: '#2E7D32', fontWeight: 'bold' }}>{book.price}</p>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#999' }}>Added: {book.dateAdded}</p>
                      <p style={{ margin: '0', fontSize: '0.9rem', color: book.status === 'available' ? '#2E7D32' : '#FF9800' }}>
                        {book.status === 'available' ? '✅ Available' : `📚 Borrowed by ${book.borrower}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem' }}>Total Earned</p>
                      <p style={{ margin: '0', color: '#2E7D32', fontWeight: 'bold', fontSize: '1.1rem' }}>{book.earnings}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => alert(`Editing ${book.title}...`)}
                      style={{
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        const newStatus = book.status === 'available' ? 'unavailable' : 'available';
                        if (book.id.toString().startsWith('sample')) {
                          alert(`${book.title} marked as ${newStatus}`);
                        } else {
                          setAllUsers(prev => ({
                            ...prev,
                            [user.email]: {
                              ...prev[user.email],
                              books: prev[user.email].books.map(b => 
                                b.id === book.id ? { ...b, status: newStatus } : b
                              )
                            }
                          }));
                        }
                      }}
                      style={{
                        backgroundColor: book.status === 'available' ? '#FF9800' : '#2E7D32',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {book.status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button
                      onClick={() => {
                        if (book.id.toString().startsWith('sample')) {
                          alert('Cannot delete sample books. Add your own books to manage them.');
                        } else {
                          requestOtpAction('delete', { bookId: book.id, bookTitle: book.title });
                        }
                      }}
                      style={{
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    const AdminUsersModal = () => (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '1000px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>👥 User Management</h3>
            <button
              onClick={() => setShowAdminUsers(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Community</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Books</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allUsers).map(([email, userData]) => (
                  <tr key={email}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{email}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{userData.community}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{userData.books?.length || 0}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        backgroundColor: userData.verified !== false ? '#e8f5e8' : '#ffebee',
                        color: userData.verified !== false ? '#2e7d32' : '#d32f2f'
                      }}>
                        {userData.verified !== false ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <button
                        style={{
                          backgroundColor: userData.verified !== false ? '#d32f2f' : '#2e7d32',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        onClick={() => {
                          const updatedUsers = { ...allUsers };
                          updatedUsers[email] = { 
                            ...userData, 
                            verified: userData.verified === false ? true : false 
                          };
                          setAllUsers(updatedUsers);
                          localStorage.setItem('communityLibraryAllUsers', JSON.stringify(updatedUsers));
                        }}
                      >
                        {userData.verified !== false ? 'Suspend' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    const AdminBooksModal = () => (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '1000px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>📚 All Books Management</h3>
            <button
              onClick={() => setShowAdminBooks(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#666', margin: 0 }}>
              Total Books: {allBooksForAdmin.length} | Available: {allBooksForAdmin.filter(b => b.available).length} | 
              Borrowed: {allBooksForAdmin.filter(b => !b.available).length}
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Author</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Owner</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Community</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {allBooksForAdmin.map(book => (
                  <tr key={book.id}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{book.title}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{book.author}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{book.owner}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{book.community}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        backgroundColor: book.available ? '#e8f5e8' : '#ffebee',
                        color: book.available ? '#2e7d32' : '#d32f2f'
                      }}>
                        {book.available ? 'Available' : 'Borrowed'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{book.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    const AdminCommunitiesModal = () => (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>🏘️ Community Management</h3>
            <button
              onClick={() => setShowAdminCommunities(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'grid', gap: '20px' }}>
            {communities.map(community => {
              const communityUsers = Object.values(allUsers).filter(u => u.community === community);
              const communityBooks = allBooksForAdmin.filter(b => b.community === community);
              
              return (
                <div key={community} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#fafafa'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>{community}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '0.9rem' }}>
                    <div>
                      <strong>👥 Users:</strong> {communityUsers.length}
                      <br />
                      <span style={{ color: '#666' }}>
                        Verified: {communityUsers.filter(u => u.verified !== false).length}
                      </span>
                    </div>
                    <div>
                      <strong>📚 Books:</strong> {communityBooks.length}
                      <br />
                      <span style={{ color: '#666' }}>
                        Available: {communityBooks.filter(b => b.available).length}
                      </span>
                    </div>
                    <div>
                      <strong>💰 Activity:</strong>
                      <br />
                      <span style={{ color: '#666' }}>
                        Total Earnings: ₹{communityBooks.reduce((sum, book) => sum + parseInt(book.earnings?.replace('₹', '') || '0'), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    const EditProfileModal = () => {
      const handleProfileUpdate = () => {
        // Check OTP first
        if (otp !== '1234') {
          alert('Invalid OTP. Please enter 1234 for demo.');
          return;
        }

        // Update user data
        const updatedUser = {
          ...user,
          name: editProfileData.name,
          email: editProfileData.email,
          mobile: editProfileData.mobile,
          block: editProfileData.block,
          apartment: editProfileData.apartment
        };

        // Update in allUsers
        const updatedAllUsers = {
          ...allUsers,
          [user.email]: {
            ...allUsers[user.email],
            ...updatedUser
          }
        };

        // If email changed, we need to handle the key change
        if (editProfileData.email !== user.email) {
          delete updatedAllUsers[user.email];
          updatedAllUsers[editProfileData.email] = {
            ...allUsers[user.email],
            ...updatedUser
          };
        }

        setAllUsers(updatedAllUsers);
        setUser(updatedUser);
        localStorage.setItem('communityLibraryAllUsers', JSON.stringify(updatedAllUsers));
        localStorage.setItem('communityLibraryCurrentUser', JSON.stringify(updatedUser));
        
        alert('Profile updated successfully!');
        setShowEditProfile(false);
        setShowOtpModal(false);
        setOtp('');
      };

      const handleSaveProfile = () => {
        if (!editProfileData.name || !editProfileData.email) {
          alert('Name and email are required fields.');
          return;
        }

        // Show OTP modal for verification
        setOtpAction(handleProfileUpdate);
        setOtpData({ action: 'profile_update' });
        setShowOtpModal(true);
      };

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>✏️ Edit Profile</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                Name *
              </label>
              <input
                type="text"
                value={editProfileData.name}
                onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                Email *
              </label>
              <input
                type="email"
                value={editProfileData.email}
                onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                Mobile Number
              </label>
              <input
                type="tel"
                value={editProfileData.mobile}
                onChange={(e) => setEditProfileData({...editProfileData, mobile: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter mobile number"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                  Block
                </label>
                <input
                  type="text"
                  value={editProfileData.block}
                  onChange={(e) => setEditProfileData({...editProfileData, block: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                  Apartment
                </label>
                <input
                  type="text"
                  value={editProfileData.apartment}
                  onChange={(e) => setEditProfileData({...editProfileData, apartment: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="e.g., 101, 205"
                />
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '4px', 
              padding: '10px', 
              marginBottom: '20px' 
            }}>
              <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                <strong>📱 Note:</strong> Profile changes require OTP verification. Use <strong>1234</strong> for demo.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "30px", color: "#333" }}>
          Dashboard - Welcome {user.name}!
          {user.role === 'superadmin' && <span style={{ color: '#d32f2f', fontSize: '1rem', marginLeft: '10px' }}>(Super Admin)</span>}
        </h2>
        
        {/* User Profile Section */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#333', marginTop: 0, marginBottom: '10px' }}>👤 Profile Information</h3>
              <p style={{ margin: '5px 0', color: '#666' }}><strong>Email:</strong> {user.email}</p>
              <p style={{ margin: '5px 0', color: '#666' }}><strong>Mobile:</strong> {user.mobile || 'Not provided'}</p>
              <p style={{ margin: '5px 0', color: '#666' }}><strong>Community:</strong> {user.community}</p>
              {user.block && <p style={{ margin: '5px 0', color: '#666' }}><strong>Block:</strong> {user.block}</p>}
              {user.apartment && <p style={{ margin: '5px 0', color: '#666' }}><strong>Apartment:</strong> {user.apartment}</p>}
            </div>
            <button
              onClick={() => {
                setEditProfileData({
                  name: user?.name || '',
                  email: user?.email || '',
                  mobile: user?.mobile || '',
                  block: user?.block || '',
                  apartment: user?.apartment || ''
                });
                setShowEditProfile(true);
              }}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>
        
        {user.role === 'superadmin' && (
          <div style={{
            backgroundColor: '#fff3e0',
            border: '2px solid #ff9800',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{ color: '#e65100', marginTop: 0 }}>🔧 Super Admin Controls</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <button
                onClick={() => setShowAdminUsers(true)}
                style={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                👥 Manage Users
              </button>
              <button
                onClick={() => setShowAdminBooks(true)}
                style={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                📚 All Books
              </button>
              <button
                onClick={() => setShowAdminCommunities(true)}
                style={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                🏘️ Communities
              </button>
            </div>
          </div>
        )}
        
        {userCommunity && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #2E7D32',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '30px'
          }}>
            <p style={{ margin: 0, color: '#2E7D32', fontWeight: 'bold' }}>
              🏘️ Community: {userCommunity}
            </p>
          </div>
        )}
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "20px", 
          marginBottom: "40px" 
        }}>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "#E8F5E8", 
            borderRadius: "8px", 
            border: "1px solid #2E7D32" 
          }}>
            <h3 style={{ color: "#2E7D32", marginBottom: "15px" }}>📚 My Books</h3>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#333" }}>{allMyBooks.length} Listed</p>
            <p style={{ color: "#666" }}>{allMyBooks.filter(book => book.status === 'borrowed').length} Currently Borrowed</p>
            <button
              onClick={() => setShowMyBooks(true)}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginTop: '10px'
              }}
            >
              Manage Books
            </button>
            <button
              onClick={() => setShowBorrowedBooks(true)}
              style={{
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginTop: '10px',
                marginLeft: '10px'
              }}
            >
              View Borrowed
            </button>
          </div>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "#FFF3E0", 
            borderRadius: "8px", 
            border: "1px solid #FF9800" 
          }}>
            <h3 style={{ color: "#FF9800", marginBottom: "15px" }}>📖 Borrowed</h3>
            {(() => {
              // Find books borrowed by the current user
              const userEmail = user?.email;
              const borrowedBooks = [];
              
              // Check all users' books to find ones borrowed by current user
              Object.values(allUsers).forEach(userData => {
                if (userData.books) {
                  userData.books.forEach(book => {
                    if (book.borrowerEmail === userEmail) {
                      borrowedBooks.push({
                        ...book,
                        currentRent: calculateRent(book.borrowDate, book.dailyRate || 10, book.maxRentalDays || 14),
                        maxRentalDays: book.maxRentalDays || 14
                      });
                    }
                  });
                }
              });
              
              // Calculate upcoming dues (<=2 days left to due)
              const dueSoon = borrowedBooks.filter(book => {
                if (!book.borrowDate) return false;
                const borrowDate = new Date(book.borrowDate);
                const dueDate = new Date(borrowDate.getTime() + book.maxRentalDays*24*60*60*1000);
                const diffDays = Math.ceil((dueDate - new Date())/(1000*60*60*24));
                return diffDays <= 2 && diffDays >= 0;
              }).length;
              
              const totalOwed = borrowedBooks.reduce((sum,b)=> sum + (b.currentRent||0),0);
              return (
                <>
                  <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#333", marginBottom:'6px' }}>{borrowedBooks.length} Books</p>
                  <p style={{ color: "#666", margin:'4px 0' }}>{dueSoon} Due Soon</p>
                  <p style={{ color:'#FF9800', fontWeight:'bold', margin:'4px 0' }}>Owed Now: ₹{totalOwed}</p>
                  <button
                    onClick={() => setShowBorrowedBooks(true)}
                    style={{
                      backgroundColor: '#FF9800',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      marginTop: '8px'
                    }}
                  >
                    View Borrowed Books
                  </button>
                </>
              );
            })()}
          </div>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "#E3F2FD", 
            borderRadius: "8px", 
            border: "1px solid #2196F3" 
          }}>
            <h3 style={{ color: "#2196F3", marginBottom: "15px" }}>💰 Wallet (WIP)</h3>
            <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333", marginBottom:'6px' }}>Offline Only</p>
            <p style={{ color: "#666", fontSize:'0.9rem', margin:0 }}>Coming soon: deposits, payouts, history</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          <div>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>Recent Activity</h3>
            <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
              {(() => {
                const activities = [];
                Object.entries(bookRequests).forEach(([ownerEmail, ownerReqs]) => {
                  Object.entries(ownerReqs || {}).forEach(([bookId, req]) => {
                    const book = (allUsers[ownerEmail]?.books||[]).find(b=> String(b.id)===String(bookId));
                    if (!book) return;
                    const title = book.title;
                    activities.push({ time: req.requestDate, type:'Request', text: `${req.requesterName} requested "${title}"` });
                    if (req.checkoutDate) activities.push({ time: req.checkoutDate, type:'Checkout', text: `Checkout: "${title}" to ${req.requesterName}` });
                    if (req.returnDate) activities.push({ time: req.returnDate, type:'Return', text: `Returned: "${title}" by ${req.requesterName}` });
                  });
                });
                activities.sort((a,b)=> new Date(b.time)-new Date(a.time));
                const recent = activities.slice(0,5);
                if (recent.length===0) return <p style={{margin:0,color:'#666',fontSize:'0.9rem'}}>No activity yet.</p>;
                return recent.map((act,i)=>(
                  <div key={i} style={{ borderBottom: i<recent.length-1?'1px solid #eee':'none', paddingBottom: i<recent.length-1?'10px':'0', marginBottom: i<recent.length-1?'10px':'0' }}>
                    <p style={{margin:'0 0 4px 0', fontSize:'0.9rem'}}><strong>{act.type}:</strong> {act.text}</p>
                    <p style={{margin:0, fontSize:'0.75rem', color:'#666'}}>{new Date(act.time).toLocaleString()}</p>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => navigate("books")}
                style={{
                  backgroundColor: "#2E7D32",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Add New Book
              </button>
              <button
                onClick={() => requestOtpAction('wallet', { action: 'manage' })}
                style={{
                  backgroundColor: "#2196F3",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Manage Wallet (Requires OTP)
              </button>
            </div>
          </div>
        </div>

        {showMyBooks && <MyBooksModal />}
        {showBorrowedBooks && <BorrowedBooksModal />}
        {showOtpModal && <OtpModal />}
        {showEditProfile && <EditProfileModal />}
        {showAdminUsers && <AdminUsersModal />}
        {showAdminBooks && <AdminBooksModal />}
        {showAdminCommunities && <AdminCommunitiesModal />}
      </div>
    );
  };

  const LoginPage = () => {
    const [formData, setFormData] = useState({ emailOrUsername: '', password: '', mobile: '' });
    const [loginMethod, setLoginMethod] = useState('standard'); // 'standard' or 'mobile'

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Check if user exists in allUsers
      const existingUser = allUsers[formData.emailOrUsername];
      if (existingUser && existingUser.password === formData.password) {
        // User exists and password matches
        setUser(existingUser);
        setUserCommunity(existingUser.community);
        localStorage.setItem('communityLibraryCurrentUser', JSON.stringify(existingUser));
        alert(`Login successful! Welcome back to ${existingUser.community}`);
        navigate('dashboard');
      } else {
        // For demo purposes, allow login with demo accounts
        const userData = { 
          name: formData.emailOrUsername.includes('@') ? formData.emailOrUsername.split('@')[0] : formData.emailOrUsername, 
          email: formData.emailOrUsername.includes('@') ? formData.emailOrUsername : `${formData.emailOrUsername}@example.com`,
          mobile: formData.mobile 
        };
        
        // Simulate community assignment based on email domain or username
        let community = "Aparna Sarovar Zenith";
        let role = "resident";
        
        if (formData.emailOrUsername === 'admin@aparna.com' && formData.password === 'admin123') {
          community = "All";
          role = "superadmin";
        } else if (formData.emailOrUsername.includes('sarovar') || formData.emailOrUsername === 'sarovar_user') {
          community = "Aparna Sarovar";
        } else if (formData.emailOrUsername.includes('cyberzon') || formData.emailOrUsername === 'cyberzon_user') {
          community = "Aparna Cyberzon";
        }
        
        userData.community = community;
        userData.role = role;
        
        // Add demo user to allUsers if not exists
        setAllUsers(prev => ({
          ...prev,
          [userData.email]: {
            ...userData,
            books: []
          }
        }));
        
        setUser(userData);
        setUserCommunity(community);
        localStorage.setItem('communityLibraryCurrentUser', JSON.stringify(userData));
        alert(`Login successful! Welcome to ${community}`);
        navigate('dashboard');
      }
    };

    return (
      <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>Login</h2>
        
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px', 
            padding: '2px' 
          }}>
            <button
              type="button"
              onClick={() => setLoginMethod('standard')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: loginMethod === 'standard' ? '#2E7D32' : 'transparent',
                color: loginMethod === 'standard' ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Username/Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('mobile')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: loginMethod === 'mobile' ? '#2E7D32' : 'transparent',
                color: loginMethod === 'mobile' ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Mobile + OTP
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <input
            type="text"
            placeholder={loginMethod === 'standard' ? "Username or Email" : "Email"}
            value={formData.emailOrUsername}
            onChange={(e) => setFormData(prev => ({ ...prev, emailOrUsername: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          />
          
          {loginMethod === 'mobile' && (
            <input
              type="tel"
              placeholder="Mobile Number (+91XXXXXXXXXX)"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              style={{ 
                padding: "12px", 
                fontSize: "1rem", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                boxSizing: "border-box"
              }}
              required
            />
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          />
          
          <button
            type="submit"
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "12px",
              fontSize: "1rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {loginMethod === 'standard' ? 'Login' : 'Send OTP & Login'}
          </button>
        </form>
        
        {loginMethod === 'standard' && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #2E7D32',
            borderRadius: '4px',
            padding: '10px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2E7D32' }}>
              <strong>Demo accounts:</strong><br/>
              Username: <strong>john_doe</strong> → Aparna Sarovar Zenith<br/>
              Username: <strong>sarovar_user</strong> → Aparna Sarovar<br/>
              Username: <strong>cyberzon_user</strong> → Aparna Cyberzon<br/>
              Username: <strong>admin@aparna.com</strong> → Super Admin (All Communities)<br/>
              Password: <strong>any</strong>
            </p>
          </div>
        )}
        
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Don't have an account? 
          <button 
            onClick={() => navigate('register')}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#2E7D32", 
              cursor: "pointer", 
              textDecoration: "underline",
              marginLeft: "5px"
            }}
          >
            Register here
          </button>
        </p>
      </div>
    );
  };

  const RegisterPage = () => {
    const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      mobile: '',
  whatsappSame: true,
  whatsappNumber: '',
      community: '',
      blockNumber: '',
      apartmentNumber: '',
      password: '',
      confirmPassword: ''
    });

    const communities = [
      'Aparna Sarovar Zenith',
      'Aparna Sarovar',
      'Aparna Cyberzon',
      'Aparna Cyberlife',
      'Aparna Cybercommune',
      'Aparna Sarovar Zicon',
      'Aparna Sarovar Grande'
    ];

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      
      const userData = { 
        name: formData.fullName, 
        email: formData.email, 
        mobile: formData.mobile,
        whatsapp: formData.whatsappSame ? formData.mobile : formData.whatsappNumber,
        whatsappConsent: true,
        blockNumber: formData.blockNumber,
        apartmentNumber: formData.apartmentNumber,
        community: formData.community,
        password: formData.password
      };
      
      // Register user in allUsers
      setAllUsers(prev => ({
        ...prev,
        [formData.email]: {
          ...userData,
          books: []
        }
      }));
      
      setUser(userData);
      setUserCommunity(formData.community);
      localStorage.setItem('communityLibraryCurrentUser', JSON.stringify(userData));
      
      alert(`Registration successful! Welcome to ${formData.community}, Block ${formData.blockNumber}, Apt ${formData.apartmentNumber}`);
      navigate('dashboard');
    };

    return (
      <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
  <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>Join ComLib</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          />
          <input
            type="tel"
            placeholder="Mobile Number (+91XXXXXXXXXX)"
            value={formData.mobile}
            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          />
          <div style={{background:'#f5f5f5', padding:'10px', border:'1px solid #ddd', borderRadius:'4px'}}>
            <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.9rem'}}>
              <input type="checkbox" checked={formData.whatsappSame} onChange={e=> setFormData(p=>({...p, whatsappSame: e.target.checked}))} />
              Use same number for WhatsApp communication
            </label>
            {!formData.whatsappSame && (
              <input
                type="tel"
                placeholder="WhatsApp Number"
                value={formData.whatsappNumber}
                onChange={(e)=> setFormData(p=>({...p, whatsappNumber: e.target.value}))}
                style={{ marginTop:'8px', padding:'10px', width:'100%', border:'1px solid #ccc', borderRadius:'4px'}}
                required
              />
            )}
            <p style={{margin:'8px 0 0 0', fontSize:'0.7rem', color:'#555'}}>We'll use this number for borrow/return coordination only.</p>
          </div>
          <select
            value={formData.community}
            onChange={(e) => setFormData(prev => ({ ...prev, community: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          >
            <option value="">Select Your Community/Society</option>
            {communities.map(community => (
              <option key={community} value={community}>{community}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Block Number"
              value={formData.blockNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, blockNumber: e.target.value }))}
              style={{ 
                padding: "12px", 
                fontSize: "1rem", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                boxSizing: "border-box",
                flex: 1
              }}
              required
            />
            <input
              type="text"
              placeholder="Apartment Number"
              value={formData.apartmentNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, apartmentNumber: e.target.value }))}
              style={{ 
                padding: "12px", 
                fontSize: "1rem", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                boxSizing: "border-box",
                flex: 1
              }}
              required
            />
          </div>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            style={{ 
              padding: "12px", 
              fontSize: "1rem", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
            required
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "12px",
              fontSize: "1rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Create Account
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Already have an account? 
          <button 
            onClick={() => navigate('login')}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#2E7D32", 
              cursor: "pointer", 
              textDecoration: "underline",
              marginLeft: "5px"
            }}
          >
            Login here
          </button>
        </p>
      </div>
    );
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "books":
        return <BooksPage />;
      case "dashboard":
        return <DashboardPage />;
      case "login":
        return <LoginPage />;
      case "register":
        return <RegisterPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="App">
      <Header />
      <main style={{ minHeight: "calc(100vh - 80px)", backgroundColor: "#f5f5f5" }}>
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default App;
