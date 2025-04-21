import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { debugLog } from '../config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    debugLog('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="h1" gutterBottom color="error">
                Something went wrong
              </Typography>
              <Typography variant="body1" paragraph>
                An error occurred in this component. Please try again later or contact support.
              </Typography>
              {this.state.error && (
                <Box sx={{ mt: 2, mb: 2, textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Error: {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography 
                      variant="caption" 
                      component="pre" 
                      sx={{ 
                        mt: 1, 
                        overflow: 'auto', 
                        maxHeight: '200px',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.75rem'
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              )}
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={this.handleReset}
                  sx={{ mr: 2 }}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  onClick={() => window.location.href = '/'}
                >
                  Go Home
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 