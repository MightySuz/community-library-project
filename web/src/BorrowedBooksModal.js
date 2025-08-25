    const BorrowedBooksModal = () => {
      // Get books borrowed by the current user
      const getBorrowedBooks = () => {
        const allBorrowedBooks = [];
        Object.values(allUsers).forEach(userData => {
          if (userData.books) {
            userData.books.forEach(book => {
              if (book.status === 'checked-out' && book.borrower === user.email) {
                // Calculate current rent
                const rentAccrued = calculateRent(book.borrowDate, book.dailyRate || 10);
                allBorrowedBooks.push({
                  ...book,
                  ownerName: userData.name,
                  rentAccrued: rentAccrued
                });
              }
            });
          }
        });
        return allBorrowedBooks;
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
              <h3 style={{ margin: 0, color: '#333' }}>My Borrowed Books</h3>
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
            <div style={{ display: 'grid', gap: '15px' }}>
              {getBorrowedBooks().length > 0 ? (
                getBorrowedBooks().map(book => (
                  <div key={book.id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#fff8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{book.title}</h4>
                        <p style={{ margin: '0 0 5px 0', color: '#666' }}>by {book.author}</p>
                        <p style={{ margin: '0 0 5px 0', color: '#666' }}>Owned by: {book.ownerName}</p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#999' }}>
                          Borrowed on: {new Date(book.borrowDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ 
                        backgroundColor: '#FFF3E0', 
                        padding: '10px', 
                        borderRadius: '4px',
                        border: '1px solid #FF9800'
                      }}>
                        <p style={{ margin: '0 0 5px 0', color: '#FF9800', fontWeight: 'bold' }}>
                          Rate: ₹{book.dailyRate || 10}/day
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#FF9800', fontWeight: 'bold' }}>
                          Days: {Math.ceil((new Date() - new Date(book.borrowDate)) / (1000 * 60 * 60 * 24))}
                        </p>
                        <p style={{ margin: '0', color: '#FF9800', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          Total: ₹{book.rentAccrued}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '15px' }}>
                      <button
                        onClick={() => alert("Return request sent to owner")}
                        style={{
                          backgroundColor: '#2E7D32',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Return Book
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>
                  You haven't borrowed any books yet.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    };
