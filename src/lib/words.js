// word pairs for each theme: { civilian, impostor }
export const WORD_BANK = {
    animaux: [
        { civilian: "Lion", impostor: "Tigre" },
        { civilian: "Dauphin", impostor: "Requin" },
        { civilian: "Cheval", impostor: "Âne" },
        { civilian: "Crocodile", impostor: "Alligator" },
        { civilian: "Pingouin", impostor: "Manchot" },
        { civilian: "Loup", impostor: "Chien" },
        { civilian: "Grenouille", impostor: "Crapaud" },
        { civilian: "Aigle", impostor: "Faucon" },
        { civilian: "Cobra", impostor: "Python" },
        { civilian: "Gorille", impostor: "Chimpanzé" },
    ],
    food: [
        { civilian: "Pizza", impostor: "Tarte flambée" },
        { civilian: "Sushi", impostor: "Maki" },
        { civilian: "Burger", impostor: "Sandwich" },
        { civilian: "Crêpe", impostor: "Gaufre" },
        { civilian: "Ramen", impostor: "Pho" },
        { civilian: "Tacos", impostor: "Burrito" },
        { civilian: "Croissant", impostor: "Pain au chocolat" },
        { civilian: "Lasagne", impostor: "Moussaka" },
        { civilian: "Kebab", impostor: "Shawarma" },
        { civilian: "Tiramisu", impostor: "Charlotte" },
    ],
    films: [
        { civilian: "Titanic", impostor: "Pearl Harbor" },
        { civilian: "Avatar", impostor: "Dune" },
        { civilian: "Joker", impostor: "Batman" },
        { civilian: "Inception", impostor: "Interstellar" },
        { civilian: "Matrix", impostor: "Tron" },
        { civilian: "Toy Story", impostor: "Shrek" },
        { civilian: "Parasite", impostor: "Squid Game" },
        { civilian: "Jurassic Park", impostor: "King Kong" },
        { civilian: "Harry Potter", impostor: "Le Seigneur des Anneaux" },
        { civilian: "Fast and Furious", impostor: "Need for Speed" },
    ],
    sport: [
        { civilian: "Football", impostor: "Rugby" },
        { civilian: "Tennis", impostor: "Badminton" },
        { civilian: "Natation", impostor: "Water-polo" },
        { civilian: "Boxe", impostor: "MMA" },
        { civilian: "Cyclisme", impostor: "Triathlon" },
        { civilian: "Ski", impostor: "Snowboard" },
        { civilian: "Basket", impostor: "Handball" },
        { civilian: "Golf", impostor: "Pétanque" },
        { civilian: "Judo", impostor: "Karaté" },
        { civilian: "Volley", impostor: "Beach Volley" },
    ],
    tech: [
        { civilian: "iPhone", impostor: "Samsung Galaxy" },
        { civilian: "Google", impostor: "Bing" },
        { civilian: "Instagram", impostor: "TikTok" },
        { civilian: "Netflix", impostor: "Disney+" },
        { civilian: "Twitch", impostor: "YouTube" },
        { civilian: "Discord", impostor: "Slack" },
        { civilian: "Minecraft", impostor: "Roblox" },
        { civilian: "PlayStation", impostor: "Xbox" },
        { civilian: "ChatGPT", impostor: "Claude" },
        { civilian: "MacBook", impostor: "Surface" },
    ],
};

export const THEMES = Object.keys(WORD_BANK);

// pick a random word pair from a given theme
export const getRandomPair = (theme) => {
    const pairs = WORD_BANK[theme];
    return pairs[Math.floor(Math.random() * pairs.length)];
};
export const getRandomPairAnyTheme = () => {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    return getRandomPair(theme);
};
