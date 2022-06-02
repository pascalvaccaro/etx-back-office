import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@strapi/design-system/Button';
import { Box } from '@strapi/design-system/Box';
import { Divider } from '@strapi/design-system/Divider';
import { useCMEditViewDataManager, prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';
import Eye from '@strapi/icons/Eye';

import getTrad from '../utils/getTrad';

const Preview = () => {
  const { initialData, layout: { uid } } = useCMEditViewDataManager();
  const isArticleDetailPage = React.useMemo(() => uid === 'api::article.article', [uid]);
  const { isPublished, externalUrl, entityId } = React.useMemo(() => ({
    isPublished: !!initialData?.publishedAt,
    externalUrl: initialData?.externalUrl ?? '',
    entityId: initialData?.id,
  }), [initialData]);

  const handlePreview = React.useCallback(() => {
    if (entityId) window.open(prefixFileUrlWithBackendUrl('/etx-studio/preview/' + entityId), '_blank', 'popup=true');
  }, [entityId]);
  const handleVisit = React.useCallback(() => {
    if (externalUrl) window.open(externalUrl, '_blank');
  }, [externalUrl]);

  return isArticleDetailPage ? (
    <>
      <Divider unsetMargin={false} />
      <Box paddingTop={4} basis="100%">
        {isPublished ?
          <Button disabled={!externalUrl} startIcon={<Eye />} variant="success-light" fullWidth onClick={handleVisit}>
            <FormattedMessage id={getTrad('preview.visit')} defaultMessage="Visit" />
          </Button>
          :
          <Button disabled={!entityId} startIcon={<Eye />} variant="secondary" fullWidth onClick={handlePreview}>
            <FormattedMessage id={getTrad('preview.title')} defaultMessage="Preview" />
          </Button>
        }
      </Box>
    </>
  ) : null;
};

export default Preview;