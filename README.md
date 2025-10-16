# Gemini-Integrated Express AI Backend

This is a Node.js backend server built with Express.js that integrates with Google’s Gemini generative language API. 
It serves as an AI assistant API which answers user questions based on custom JSON knowledge files loaded at runtime.
_____________________________________________________________________________________________________________________


## Features

- Loads JSON knowledge files from a local folder (`./knowledge_json`)
- Combines knowledge into context passed to Gemini API
- Custom prompt instructing Gemini to answer as "Krishna" with contemporary life examples
- API endpoint `/ask` accepts questions and returns AI-generated answers
- CORS enabled for frontend integration
- Environment-based configuration using `.env` file for Gemini API key and port
- Error handling for missing API key, no knowledge files, and API call errors

______________________________________________________________________________________________________________________

### Prerequisites

- Node.js (v16+ recommended)
- Gemini API key from Google Cloud (put in `.env` as `GEMINI_API_KEY`)

__________________________________________________________________________________________________________________
## Contact

For issues or feature requests, please open an issue in the repository.