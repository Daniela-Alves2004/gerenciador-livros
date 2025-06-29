import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { fetchUserCollection } from './requestApi';

const initialState = {
  user: null,
  isAuthenticated: false,
  searchResults: [],
  isLoading: false,
  error: null,
  selectedBook: null,
  collection: {
    read: [],
    wantToRead: []
  }
};

export const ActionTypes = {
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SELECT_BOOK: 'SELECT_BOOK',
  CLEAR_SELECTED_BOOK: 'CLEAR_SELECTED_BOOK',
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  SET_COLLECTION: 'SET_COLLECTION',
  ADD_BOOK_TO_COLLECTION: 'ADD_BOOK_TO_COLLECTION',
  REMOVE_BOOK_FROM_COLLECTION: 'REMOVE_BOOK_FROM_COLLECTION',
  MOVE_BOOK: 'MOVE_BOOK',
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
    case ActionTypes.SELECT_BOOK:
      return {
        ...state,
        selectedBook: action.payload
      };
    case ActionTypes.CLEAR_SELECTED_BOOK:
      return {
        ...state,
        selectedBook: null
      };
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        error: null
      };    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        collection: {
          read: [],
          wantToRead: []
        }
      };
    case ActionTypes.SET_COLLECTION:
      return {
        ...state,
        collection: action.payload
      };
    case ActionTypes.ADD_BOOK_TO_COLLECTION:
      return {
        ...state,
        collection: {
          ...state.collection,
          [action.payload.status]: [
            ...state.collection[action.payload.status],
            action.payload.book
          ]
        }
      };
    case ActionTypes.REMOVE_BOOK_FROM_COLLECTION:
      return {
        ...state,
        collection: {
          ...state.collection,
          [action.payload.status]: state.collection[action.payload.status]
            .filter(book => book.id !== action.payload.bookId)
        }
      };
    case ActionTypes.MOVE_BOOK:
      const { bookId, fromStatus, toStatus } = action.payload;
      const bookToMove = state.collection[fromStatus]
        .find(book => book.id === bookId);
      
      return {
        ...state,
        collection: {
          ...state.collection,
          [fromStatus]: state.collection[fromStatus]
            .filter(book => book.id !== bookId),
          [toStatus]: [
            ...state.collection[toStatus],
            bookToMove
          ]
        }
      };
    default:
      return state;
    }

};

const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookReducer, initialState);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          
          if (parsedUser && parsedUser.id) {
            dispatch({ 
              type: ActionTypes.SET_USER, 
              payload: parsedUser 
            });

            fetchUserCollection(parsedUser.id)
              .then(collection => {
                if (collection) {
                  dispatch({
                    type: ActionTypes.SET_COLLECTION,
                    payload: collection
                  });
                }
              })
              .catch(err => console.error('Erro ao carregar coleção:', err));
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Limpar dados possivelmente corrompidos
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    };
    
    checkAuth();
  }, []);

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