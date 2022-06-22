const commonFilters = {
  sort: 'updatedAt:asc',
  filters: {},
  populate: {},
  publicationState: 'preview'
};

export const onFire = {
  ...commonFilters,
  filters: {
    $and: [{ publishedAt: { $null: true } }]
  },
};

export const published = {
  ...commonFilters,
  sort: 'publishedAt:asc',
  publicationState: 'live'
};

export const icono = {
  ...commonFilters,
  filters: {
    $and: [{ attachments: { $and: [{ id: { $null: true }}] }}]
  },
  populate: 'attachments',
};

export const translate = {
  ...commonFilters,
  filters: {
    $and: [{ translate: true }, { publishedAt: { $null: true } }],
  },
  sort: 'createdAt:asc',
};

export const submitted = {
  ...commonFilters,
  filters: {
    $and: [{ submitted: true }, { publishedAt: { $null: true } }]
  },
};

export const mine = ({ user }) => ({
  ...commonFilters,
  populate: 'createdBy',
  filters: { $and: [{ createdBy: { id: user.id } }] }
});

export default commonFilters;
