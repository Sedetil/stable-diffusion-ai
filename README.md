# AI Creation Studio

A modern web application that combines text-to-image generation and AI chat capabilities using Hugging Face's API.

## Features

- **Image Generation**: Create images from text descriptions using various AI models
- **AI Chat**: Chat with an AI assistant powered by the OpenAssistant model
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between dark and light themes
- **Modern UI**: Clean and intuitive user interface

## Project Structure

```
project/
├── assets/
│   ├── css/
│   │   └── styles.css       # Styling for the application
│   ├── js/
│   │   ├── imageGenerator.js # Image generation functionality
│   │   ├── aiChat.js        # AI chat functionality
│   │   └── main.js          # Main application logic and shared utilities
│   └── img/
│       └── logo.svg         # Application logo
├── index.html               # Main HTML file
└── README.md                # Project documentation
```

## Setup

1. Clone the repository
2. Open `index.html` in your browser
3. Start generating images or chatting with the AI!

## API Usage

This application uses Hugging Face's Inference API for both image generation and AI chat functionality. The following models are available:

### Image Generation Models:
- Stable Diffusion 2.1
- Openjourney
- Stable Diffusion 1.5

### AI Chat Model:
- OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5

## Security Note

In a production environment, you should:
- Use environment variables for API keys
- Implement proper rate limiting
- Add user authentication
- Consider using a proxy server to hide API keys from client-side code

## License

[MIT License](LICENSE)

## Credits

- Fonts: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- Icons: Font Awesome 6.4.0
- API: Hugging Face Inference API and Gemini API

Check this out

https://sedetil.github.io/stable-diffusion-ai/
