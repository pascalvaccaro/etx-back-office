import React from 'react';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Flex } from '@strapi/design-system/Flex';
import { FieldInput } from '@strapi/design-system/Field';
import { Textarea } from '@strapi/design-system/Textarea';
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs';

import { insertEmbedFromJson, fetchEmbed } from './Embed';

const Wrapper = styled.div`
  color: #444;
  padding: 5px 12px;
  min-width: 50%;
  min-height: 50px;
  background-color: white;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
`;

const Tooltip = React.forwardRef(({ show, close }, ref) => {
  const wrapperRef = React.useRef(null);
  const [value, setValue] = React.useState('');
  const [tab, setTab] = React.useState(0);
  const mode = React.useMemo(() => {
    switch (tab) {
      case 0:
        return 'url';
      case 1:
        return 'html';
      default:
        return mode || 'url';
    }
  }, [tab]);

  const handleSaveEmbed = React.useCallback(async () => {
    if (!ref.current || typeof ref.current.getEditor !== 'function') return;
    const quill = ref.current.getEditor();
    if (!quill) return;

    try {
      const { index = 0 } = quill.getSelection(true) ?? {};
      // https://twitter.com/ETX_Studio/status/1516059977844154376
      const embed = mode === 'url' ? (await fetchEmbed(value)) : { html: value, type: 'rich' };
      insertEmbedFromJson.call({ quill }, embed, index);
      quill.setSelection(index + 1);
      setValue('');
      typeof close === 'function' && close();
    } catch (err) {
      console.error(err);
    }
  }, [mode, value, close]);

  return show ? (
    <Wrapper ref={wrapperRef}>
      <TabGroup label="Embed rich content into your article" initialSelectedTabIndex={tab} id="tabs" onTabChange={selected => setTab(selected)}>
        <Tabs>
          <Tab>URL</Tab>
          <Tab>HTML</Tab>
        </Tabs>
        <TabPanels>
          <TabPanel>
            <Box color="neutral800" padding={4} background="neutral0">
              <FieldInput name="value" value={mode === 'url' ? value : ''} onInput={e => setValue(e.target.value)} type="text" placeholder="Embed URL..." data-video="Embed URL" />
            </Box>
          </TabPanel>
          <TabPanel>
            <Box color="neutral800" padding={4} background="neutral0">
              <Textarea name="value" rows={4} value={mode === 'html' ? value : ''} onChange={e => setValue(e.target.value)} placeholder="Paste HTML..." />
            </Box>
          </TabPanel>
        </TabPanels>
      </TabGroup>
      <Flex justifyContent="space-between">
        <Button onClick={close} variant="secondary">Cancel</Button>
        <Button onClick={handleSaveEmbed} variant="default">Save</Button>
      </Flex>
    </Wrapper>
  ) : null;
});

export default Tooltip;