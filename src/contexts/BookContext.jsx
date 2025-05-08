import React, { createContext, useReducer, useContext } from 'react';

const initialState = {
  
  searchResults: [],
  isLoading: false,
  error: null,
  selectedBook: null
};

export const ActionTypes = {
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

const bookReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: action.payload,
        isLoading: false,
        error: null
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    default:
      return state;
    }

};

const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookReducer, initialState);

  return (
    <BookContext.Provider value={{ state, dispatch }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBookContext = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBookContext must be used within a BookProvider');
  }
  return context;
};