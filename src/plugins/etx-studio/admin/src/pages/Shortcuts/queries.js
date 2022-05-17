export const onFire = {
  filters: {
    $and: [{ publishedAt: { $null: true } }]
  },
  sort: 'updatedAt:asc',
  publicationState: 'preview'
};

export const published = {
  sort: 'publishedAt:asc',
  publicationState: 'live'
};

export const icono = {
  populate: {
    medias: {
      filters: {
        $and: [{ $null: true }]
      }
    }
  },
  sort: 'updatedAt:asc',
  publicationState: 'preview',
};

export const translate = {
  populate: 'localizations',
  filters: {
    $and: [{ localizations: { title: { $null: true }}}, { publishedAt: { $null: true }}],
  },
  sort: 'createdAt:desc',
  publicationState: 'preview',
}

export default {
  sort: 'title:asc',
  filters: {},
  populate: {},
  publicationState: 'preview'
}