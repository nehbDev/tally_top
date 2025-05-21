import React, { createContext, useState } from 'react';

export const BookmarkContext = createContext();

export const BookmarkProvider = ({ children }) => {
  const [bookmarkCounts, setBookmarkCounts] = useState({});

  return (
    <BookmarkContext.Provider value={{ bookmarkCounts, setBookmarkCounts }}>
      {children}
    </BookmarkContext.Provider>
  );
};