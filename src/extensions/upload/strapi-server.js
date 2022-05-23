module.exports = (plugin) => {
  const contentType = plugin.contentTypes.file;
  if (!contentType.lifecycles) contentType.lifecycles = {};
  contentType.lifecycles.beforeUpdate = async (event) => {
    const { data } = event.params;
    const { caption, credits: originalCredits = '' } = data;
    const [legend, credits] = caption.split('::').map((str = '') => str.trim());

    event.params.data.legend = legend || caption;
    event.params.data.credits = credits || originalCredits;
  };

  return plugin;
};