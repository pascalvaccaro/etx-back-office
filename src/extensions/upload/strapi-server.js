const { ValidationError } = require('@strapi/utils').errors;

module.exports = (plugin) => {
  const contentType = plugin.contentTypes.file;
  if (!contentType.lifecycles) contentType.lifecycles = {};
  
  contentType.lifecycles.beforeCreate = (event) => {
    const { data } = event.params;
    const { caption } = data;
    if (!caption) throw new ValidationError('caption field is required upon file creation');
    const [credits, specialUses] = caption.split('::').map((str = '') => str.trim());
    
    event.params.data.credits = credits;
    event.params.data.specialUses = specialUses;
  };
  contentType.lifecycles.beforeUpdate = async (event) => {
    const { data, where } = event.params;
    const { caption: newCaption = '', credits: newCredits = '', specialUses: newSU = '' } = data;
    if (!newCredits && !newSU && !newCaption) return;

    const original = await plugin.services.upload({ strapi }).findOne(where.id);

    if (newCaption && newCaption !== original.caption) {
      const [credits = '', specialUses = ''] = newCaption.split('::').map((str = '') => str.trim());
      event.params.data.credits = credits;
      event.params.data.specialUses = specialUses;
    } else {
      const caption = [
        newCredits || original.credits, 
        newSU || original.specialUses]
      .map((v = '') => v).join(' :: ');
      event.params.data.caption = caption;
    }

  };

  return plugin;
};