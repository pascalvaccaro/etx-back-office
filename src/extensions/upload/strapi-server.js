const extractImageInfosFromCaption = event => {
  const { data } = event.params;
  const { caption, credits: originalCredits = '', legend: originalLegend = '', specialUses: originalSU = '' } = data;
  const [legend, credits, specialUses] = caption.split('::').map((str = '') => str.trim());
  
  event.params.data.legend = legend || originalLegend || caption;
  event.params.data.credits = credits || originalCredits;
  event.params.data.specialUses = specialUses || originalSU;
};

module.exports = (plugin) => {
  const contentType = plugin.contentTypes.file;
  if (!contentType.lifecycles) contentType.lifecycles = {};

  contentType.lifecycles.beforeCreate = extractImageInfosFromCaption;
  contentType.lifecycles.beforeUpdate = extractImageInfosFromCaption;

  return plugin;
};