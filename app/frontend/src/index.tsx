import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import store from './store';
import App from './App';
import { createTheme } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff4655', // Valorant red
    },
    secondary: {
      main: '#0f1923', // Valorant dark blue
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
); 