import React from 'react';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@strapi/design-system/ModalLayout';
import { Typography } from '@strapi/design-system/Typography';
import FromItem from './FromItem';
import getTrad from '../../utils/getTrad';

const FromModal = ({ onSave, onClose, children, ...article }) => {
  return (
    <ModalLayout onClose={onClose} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          Prévisualiser - {article.title.slice(0, 36)}...
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
          <Button onClick={onClose} variant="tertiary">
            Annuler
          </Button>
        }
        endActions={<Button onClick={() => onSave(article)}>
          Valider
        </Button>}
      />
    </ModalLayout>
  );
};

export default FromModal;