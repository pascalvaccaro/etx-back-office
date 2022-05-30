import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@strapi/design-system/Button';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@strapi/design-system/ModalLayout';
import { Typography } from '@strapi/design-system/Typography';
import getTrad from '../../utils/getTrad';
import ErrorBoundary from '../ErrorBoundary';

const FromModal = ({
  onSave,
  onClose,
  children,
  startActions = null,
  endActions = null,
  ...article
}) => {
  return (
    <ModalLayout basis="80%" onClose={onClose} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {article.title}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Typography>
          {article.header}
        </Typography>
        <ErrorBoundary>
          {children ?? <article dangerouslySetInnerHTML={{ __html: article.content }} />}
        </ErrorBoundary>
      </ModalBody>
      <ModalFooter
        startActions={
          <>
            {startActions}
            {/* <IconButton icon={<PrevIcon />} onClick={() => dispatch({ type: 'preview.prev' })} /> */}
            <Button onClick={onClose} variant="tertiary">
              <FormattedMessage id={getTrad('preview.cancel')} defaultMessage="Annuler" />
            </Button>
          </>
        }
        endActions={
          <>
            <Button onClick={() => onSave(article)}>
              <FormattedMessage id={getTrad('preview.ok')} defaultMessage="Valider" />
            </Button>
            {endActions}
            {/* <IconButton icon={<NextIcon />} onClick={() => dispatch({ type: 'preview.next' })} /> */}
          </>
        }
      />
    </ModalLayout>
  );
};

export default FromModal;