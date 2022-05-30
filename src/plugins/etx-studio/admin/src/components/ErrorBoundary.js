import React from 'react';
import { Box } from '@strapi/design-system/Box';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import ErrorIcon from '@strapi/icons/FileError';

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
        <Box padding={8}>
          <EmptyStateLayout icon={<ErrorIcon />} content={error?.message || error || 'KO'} />
        </Box>
      );
    }

    return this.props.children;
  }
}