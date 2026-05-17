const groups = require("./groups.json");

const collectionDefinitions = [
  {
    slug: "bronx",
    groupKey: "bronx",
    title: "Bronx"
  },
  {
    slug: "brooklyn",
    groupKey: "brooklyn",
    title: "Brooklyn"
  },
  {
    slug: "manhattan",
    groupKey: "manhattan",
    title: "Manhattan"
  },
  {
    slug: "queens",
    groupKey: "queens",
    title: "Queens"
  },
  {
    slug: "staten-island",
    groupKey: "statenisland",
    title: "Staten Island"
  },
  {
    slug: "specialty",
    groupKey: "specialty",
    title: "Specialty"
  }
];

module.exports = collectionDefinitions.map((definition, index) => {
  const group = groups.find((item) => item.key === definition.groupKey);

  if (!group) {
    throw new Error(
      `Collection area '${definition.slug}' references missing group '${definition.groupKey}'`
    );
  }

  return {
    ...definition,
    order: index + 1,
    group,
    description: group.description,
    intro: group.intro || group.description,
    cardImage: group.cardImage,
    cardImageForm: group.cardImageForm
  };
});
