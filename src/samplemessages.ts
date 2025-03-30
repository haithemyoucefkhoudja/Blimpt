import { Message } from 'ai'

export const sampleAIMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: "Hello! How can I assist you today?"
  },
  {
    id: '2',
    role: 'assistant',
    content: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. Pangrams are often used to display fonts or test equipment. They're particularly useful for testing because they use all the letters, giving a good sense of what the font looks like and how it handles different character combinations."
  },
  {
    id: '3',
    role: 'user',
    content: "I'm an AI assistant, so I don't have personal emotions, but I can certainly help you with coding! 💻 It's a fascinating field with endless possibilities for creating and problem-solving. 🚀🧠"
  },
  {
    id: '4',
    role: 'assistant',
    content: "Here's a Python function to calculate Fibonacci numbers:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    else:\n        return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))\n```\n\nThis function uses recursion to calculate the nth Fibonacci number."
  },
  {
    id: '5',
    role: 'user',
    content: "For comprehensive web development resources, I recommend checking out the Mozilla Developer Network (MDN): https://developer.mozilla.org/\nIt's an excellent source of information for HTML, CSS, JavaScript, and more."
  },
  {
    id: '6',
    role: 'assistant',
    content: "Here's a suggested to-do list for developing a chat application:\n\n1. Design and implement the chat UI\n2. Set up real-time message handling\n3. Implement user authentication\n4. Add error handling and input validation\n5. Optimize performance and responsiveness\n6. Conduct thorough testing\n7. Deploy the application"
  },
  {
    id: '7',
    role: 'user',
    content: "Special characters are important in programming. Here are some commonly used ones: @#$%^&*()_+{}|:<>?~`-=[]\\;',./"
  },
  {
    id: '8',
    role: 'assistant',
    content: "Understood."
  },
  {
    id: '9',
    role: 'user',
    content: "The sentence 'Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo' is a grammatically correct sentence in American English, often used as an example of how homonyms and homophones can be used to create confusing, but valid, sentences."
  },
  {
    id: '10',
    role: 'assistant',
    content: "Hello! I can communicate in multiple languages. For example:\n日本語: こんにちは\n中文: 你好\nFrançais: Bonjour\nEspañol: Hola\nItaliano: Ciao\nРусский: Здравствуйте"
  }
]
