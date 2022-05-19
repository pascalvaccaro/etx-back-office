import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { IconButton } from '@strapi/design-system/IconButton';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@strapi/design-system/ModalLayout';
import { Typography } from '@strapi/design-system/Typography';
import PrevIcon from '@strapi/icons/ArrowLeft';
import NextIcon from '@strapi/icons/ArrowRight';
import FromItem from './FromItem';
import getTrad from '../../utils/getTrad';
import { useStore } from '../../store';

const FromModal = ({ onSave, onClose, children, ...article }) => {
  const { dispatch } = useStore();
  return (
    <ModalLayout onClose={onClose} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          <FormattedMessage id={getTrad('preview.title')} defaultMessage="Prévisualiser" /> - {article.title.slice(0, 36)}...
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Box>
          <FromItem url={article.metadata.url} hideExport />
          {children}
        </Box>
      </ModalBody>
      <ModalFooter
        startActions={
          <>
            <IconButton icon={<PrevIcon />} onClick={() => dispatch({ type: 'preview.prev' })} />
            <Button onClick={onClose} variant="tertiary">
              <FormattedMessage id={getTrad('preview.cancel')} defaultMessage="Annuler" />
            </Button>
          </>
        }
        endActions={
          <>
            <Button onClick={() => onSave(article)}>
              <FormattedMessage id={getTrad('preview.ok')} defaultMessage="Importer" />
            </Button>
            <IconButton icon={<NextIcon />} onClick={() => dispatch({ type: 'preview.next' })} />
          </>
        }
      />
    </ModalLayout>
  );
};

export default FromModal;