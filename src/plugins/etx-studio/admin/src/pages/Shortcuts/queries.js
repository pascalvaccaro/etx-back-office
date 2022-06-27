import { fetchEntityActions } from 'strapi-plugin-publisher/admin/src/api/actions';

const commonQuery = {
  sort: 'updatedAt:asc',
  filters: {},
  populate: {},
  publicationState: 'preview'
};

export const onFire = {
  ...commonQuery,
  filters: {
    $and: [{ publishedAt: { $null: true } }]
  },
};

export const published = async () => {
  const scheduled = await fetchEntityActions({ entitySlug: 'api::article.article', mode: 'publish' })
    .then(res => (res.data ?? []).map(d => d.entityId));
  return {
    ...commonQuery,
    filters: { $or: [{ id: { $in: scheduled } }, { publishedAt: { $notNull: true } }] },
    sort: 'publishedAt:asc',
  };
};

export const icono = {
  ...commonQuery,
  filters: {
    $and: [{ attachments: { $and: [{ id: { $null: true } }] } }]
  },
  populate: 'attachments',
};

export const translate = {
  ...commonQuery,
  filters: {
    $and: [{ translate: true }, { publishedAt: { $null: true } }],
  },
  sort: 'createdAt:asc',
};

export const submitted = {
  ...commonQuery,
  filters: {
    $and: [{ submitted: true }, { publishedAt: { $null: true } }]
  },
};

export const mine = ({ user }) => ({
  ...commonQuery,
  populate: 'createdBy',
  filters: { $and: [{ createdBy: { id: user.id } }] }
});

export default commonQuery;
