import React, { useEffect, useState } from 'react';

const BorrowedBooksModal = ({ isOpen, onClose, user, books, bookRequests }) => {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  
  useEffect(() => {
    if (!user || !books || !bookRequests) return;
    
    // Get all books that the current user has checked out
    const userEmail = user.email;
    const checkedOutBooks = [];
    
    // Loop through all book requests
    Object.entries(bookRequests).forEach(([ownerEmail, ownerRequests]) => {
      Object.entries(ownerRequests).forEach(([bookId, request]) => {
        // If this request is by the current user and is approved
        if (request.requesterEmail === userEmail && request.status === 'approved') {
          // Find the book details
          const bookOwner = books[ownerEmail] || {};
          const book = bookOwner[bookId];
          
          if (book) {
            // Calculate days borrowed and rent due
            const checkoutDate = new Date(request.approvalDate);
            const currentDate = new Date();
            const daysElapsed = Math.floor((currentDate - checkoutDate) / (1000 * 60 * 60 * 24));
            const rentDue = daysElapsed * (book.rentPerDay || 0);
            
            checkedOutBooks.push({
              ...book,
              id: bookId,
              ownerEmail,
              checkoutDate: checkoutDate.toLocaleDateString(),
              daysElapsed,
              rentDue
            });
          }
        }
      });
    });
    
    setBorrowedBooks(checkedOutBooks);
  }, [user, books, bookRequests, isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        width: '80%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>My Borrowed Books</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        {borrowedBooks.length === 0 ? (
          <p>You don't have any borrowed books at the moment.</p>
        ) : (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Author</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Owner</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Checkout Date</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Days Borrowed</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Rent Due (₹)</th>
                </tr>
              </thead>
              <tbody>
                {borrowedBooks.map((book, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{book.title}</td>
                    <td style={{ padding: '10px' }}>{book.author}</td>
                    <td style={{ padding: '10px' }}>{book.ownerEmail}</td>
                    <td style={{ padding: '10px' }}>{book.checkoutDate}</td>
                    <td style={{ padding: '10px' }}>{book.daysElapsed}</td>
                    <td style={{ padding: '10px' }}>₹{book.rentDue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>
                  <td colSpan="5" style={{ padding: '10px', textAlign: 'right' }}>Total Rent Due:</td>
                  <td style={{ padding: '10px' }}>
                    ₹{borrowedBooks.reduce((total, book) => total + book.rentDue, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowedBooksModal;
