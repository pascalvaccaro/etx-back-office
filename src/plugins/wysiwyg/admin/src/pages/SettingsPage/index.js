import React, { useRef } from 'react';
import { Main } from '@strapi/design-system/Main';
import { HeaderLayout, ContentLayout } from '@strapi/design-system/Layout';
import { Button } from '@strapi/design-system/Button';
import { Box } from '@strapi/design-system/Box';
import { Link } from '@strapi/design-system/Link';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';
import { useNotification, useOverlayBlocker } from '@strapi/helper-plugin';
import Cog from '@strapi/icons/Cog';
import Upload from '@strapi/icons/Upload';

import axios from '../../utils/axiosInstance';

const SettingsPage = () => {
  const inputRef = useRef();
  const toggleNotification = useNotification();
  const { lockApp, unlockApp } = useOverlayBlocker();
  const handleChangeFile = async (event) => {
    try {
      lockApp();
      const [zip] = Array.from(event.target.files || []);
      if (zip) {
        const body = new FormData();
        body.append('file', zip);
        const result = await axios
          .post('/wysiwyg/update', body, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then((res) => res.data);
        console.log(result);
        toggleNotification({ type: 'success', message: { id: 'settings.success', defaultMessage: 'Succès' } });
      } else {
        toggleNotification({ type: 'warning', message: { id: 'settings.no-file', defaultMessage: 'Pas de fichier ' } });
      }
    } catch (err) {
      console.error(err);
      toggleNotification({
        type: 'error',
        message: { id: 'settings.error', defaultMessage: 'Erreur', values: { message: err.message } },
      });
    } finally {
      unlockApp();
    }
  };

  return (
    <Main>
      <HeaderLayout title={'Rich-content Editor settings'} subtitle={'Change how the editor should behave'} />
      <ContentLayout>
        <Box>
          <Typography variant="beta">
            <Cog /> Pour personnaliser l'éditeur de contenu riche
          </Typography>
          <Stack spacing={4} padding={3}>
            <Box paddingLeft={4}>
              1. rendez-vous sur le{' '}
              <Link href="https://ckeditor.com/ckeditor-5/online-builder" isExternal>
                Online Builder de CKEditor5
              </Link>
            </Box>
            <Box paddingLeft={4}>2. renseignez les fonctionnalités à inclure dans l'éditeur</Box>
            <Box paddingLeft={4}>3. téléchargez l'archive .zip de l'étape 5 sur votre ordinateur</Box>

            <Box>
              <Button onClick={() => inputRef.current.click()} variant="secondary" endIcon={<Upload />}>
                <input ref={inputRef} type="file" onChange={handleChangeFile} style={{ display: 'none' }} />
                4. Uploadez l'archive .zip en cliquant sur ce bouton
              </Button>
            </Box>
            <Box paddingLeft={4}>5. patientez une minute, le serveur doit redémarrer pour prendre en compte vos changements</Box>
          </Stack>
        </Box>
      </ContentLayout>
      );
    </Main>
  );
};

export default React.memo(SettingsPage);
