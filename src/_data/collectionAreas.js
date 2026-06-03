const collectionDefinitions = [
  {
    slug: "bronx",
    groupKey: "bronx",
    title: "Bronx",
    cardImage: "/assets/images/thumb/628-a_o.webp",
    cardImageForm: "R",
    description: "Bronx transit tokens, including Orchard Beach and related issues."
  },
  {
    slug: "brooklyn",
    groupKey: "brooklyn",
    title: "Brooklyn",
    cardImage: "/assets/images/thumb/629-c_o.webp",
    cardImageForm: "R",
    description: "Brooklyn transit tokens from street railways and local transportation lines."
  },
  {
    slug: "manhattan",
    groupKey: "manhattan",
    title: "Manhattan",
    cardImage: "/assets/images/thumb/630-ap_o.webp",
    cardImageForm: "R",
    description: "Manhattan transit tokens, including railway, bus, and subway-related issues."
  },
  {
    slug: "queens",
    groupKey: "queens",
    title: "Queens",
    cardImage: "/assets/images/thumb/631-o_o.webp",
    cardImageForm: "R",
    description: "Queens transit tokens from local transportation and bus-related issues."
  },
  {
    slug: "staten-island",
    groupKey: "statenisland",
    title: "Staten Island",
    cardImage: "/assets/images/thumb/632-c_r.webp",
    cardImageForm: "R",
    description: "Staten Island transit tokens and related transportation pieces."
  }
];

module.exports = collectionDefinitions.map((definition, index) => {
  return {
    ...definition,
    order: index + 1,
    intro: definition.intro || definition.description
  };
});
