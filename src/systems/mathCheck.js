const QUESTIONS = [
  {
    prompt: 'A recipe uses 3 cups of flour for 12 cookies. How many cups are needed for 20 cookies?',
    choices: [
      { id: 0, text: '4 cups' },
      { id: 1, text: '5 cups' },
      { id: 2, text: '6 cups' },
      { id: 3, text: '8 cups' },
    ],
    answerIndex: 1,
  },
  {
    prompt: 'The ratio of red to blue beads is 5:3. If there are 40 red beads, how many blue beads are there?',
    choices: [
      { id: 0, text: '18' },
      { id: 1, text: '20' },
      { id: 2, text: '24' },
      { id: 3, text: '30' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'A car can travel 180 miles on 6 gallons of gas. How far can it travel on 9 gallons?',
    choices: [
      { id: 0, text: '210 miles' },
      { id: 1, text: '240 miles' },
      { id: 2, text: '270 miles' },
      { id: 3, text: '300 miles' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'A map scale shows 1 inch represents 8 miles. How many miles does 3.5 inches represent?',
    choices: [
      { id: 0, text: '20 miles' },
      { id: 1, text: '24 miles' },
      { id: 2, text: '26 miles' },
      { id: 3, text: '28 miles' },
    ],
    answerIndex: 3,
  },
  {
    prompt: 'In a class, the ratio of tablets to students is 3:5. If there are 45 students, how many tablets are there?',
    choices: [
      { id: 0, text: '21' },
      { id: 1, text: '24' },
      { id: 2, text: '27' },
      { id: 3, text: '30' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'A store sells 4 notebooks for $6. What is the unit price per notebook?',
    choices: [
      { id: 0, text: '$1.25' },
      { id: 1, text: '$1.40' },
      { id: 2, text: '$1.50' },
      { id: 3, text: '$1.75' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'To mix paint, the ratio of yellow to blue is 7:2. If you have 28 cups of yellow, how many cups of blue do you need?',
    choices: [
      { id: 0, text: '6' },
      { id: 1, text: '7' },
      { id: 2, text: '8' },
      { id: 3, text: '9' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'A jogger runs 2 miles every 15 minutes. How many miles will the jogger run in 1 hour?',
    choices: [
      { id: 0, text: '6 miles' },
      { id: 1, text: '7 miles' },
      { id: 2, text: '8 miles' },
      { id: 3, text: '9 miles' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'A sticker sheet has a scale of 1 cm to 2.5 cm in real life. If a bike sticker is 4 cm on the sheet, what is its real length?',
    choices: [
      { id: 0, text: '8 cm' },
      { id: 1, text: '9 cm' },
      { id: 2, text: '10 cm' },
      { id: 3, text: '12 cm' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'The ratio of cats to dogs at a shelter is 11:4. If there are 44 cats, how many dogs are there?',
    choices: [
      { id: 0, text: '12' },
      { id: 1, text: '14' },
      { id: 2, text: '16' },
      { id: 3, text: '18' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'A lemonade mix calls for 9 cups of water for every 4 scoops of powder. How many scoops are needed for 27 cups of water?',
    choices: [
      { id: 0, text: '10' },
      { id: 1, text: '11' },
      { id: 2, text: '12' },
      { id: 3, text: '13' },
    ],
    answerIndex: 2,
  },
  {
    prompt: 'A bike travels 15 miles in 50 minutes at a constant speed. How many miles will it travel in 80 minutes?',
    choices: [
      { id: 0, text: '20 miles' },
      { id: 1, text: '22 miles' },
      { id: 2, text: '24 miles' },
      { id: 3, text: '26 miles' },
    ],
    answerIndex: 2,
  },
];

export function getRandomMathQuestion() {
  const index = Math.floor(Math.random() * QUESTIONS.length);
  return QUESTIONS[index];
}
