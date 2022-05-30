import React from 'react';
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <Box padding={4}>
          <Typography as="pre">{error?.message || error || 'ERROR'}</Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}