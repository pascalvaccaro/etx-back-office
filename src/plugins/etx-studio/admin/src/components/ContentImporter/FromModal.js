import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@strapi/design-system/ModalLayout';
import { Typography } from '@strapi/design-system/Typography';
import { useLibrary } from '@strapi/helper-plugin';
import getTrad from '../../utils/getTrad';
import ErrorBoundary from '../ErrorBoundary';
import { useStore } from '../../store';

const FromModal = ({
  onSave,
  onClose,
  children,
  startActions = null,
  endActions = null,
  ...article
}) => {
  const { components } = useLibrary();
  const Editor = components['richeditor'];

  const { dispatch } = useStore();
  const externalUrl = React.useMemo(() => {
    try {
      return new URL(article?.externalUrl).toString();
    } catch (err) {
      return null;
    }
  }, [article]);

  React.useEffect(() => {
    if (externalUrl) dispatch({ type: 'extract.html', payload: externalUrl });
  }, [externalUrl]);

  return (
    <ModalLayout basis="80%" onClose={onClose} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {article.title}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Box paddingBottom={4}>
          <Typography>{article.header}</Typography>
        </Box>
        <ErrorBoundary>
          {article?.content
            ? <Editor
                value={article.content}
                onChange={(e) => dispatch({ type: 'preview.set', payload: { ...article, content: e.target.value } })}
                name="modal"
                disabled
              />
            : (children ?? null)
          }
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