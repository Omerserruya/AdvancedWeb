import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import e from 'express';
const router = express.Router();

// Initialize the Google Generative AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Properly type the request body
    const body = req.body as any;
    const { type, text } = body;
    
    if (!text || !type) {
      return res.status(400).json({ error: 'Text and type are required' });
    }
    
    console.log(`AI generation request: type=${type}, text='${text.substring(0, 30)}...'`);
    
    // Simple fallback responses for testing
    let generatedText = '';
    
    try {
      if (process.env.GEMINI_API_KEY) {
        // Create a generative model instance
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        // Prepare prompt based on the type
        let prompt = '';
        if (type === 'title') {
          prompt = `Generate one short, catchy, and simple title based on the following content. Return only the title: "${text}"`;
        } else if (type === 'content') {
          if(text.length<5) {
            prompt = `Generate a short, informative, and engaging post about a technology topic. If a specific tech subject is provided, focus on that. If no specific subject is given, choose a new or trending technology to share insights about. The post should be clear, concise, and interesting for a general audience.`
          }else {
            prompt = `Generate a short, informative post based on the following topic or phrase. The post should be well-structured, engaging, and focused on sharing useful information about the tech subject. Keep the language clear, concise, and appealing to a broad audience:"${text}"`;
        }
      } else {
          return res.status(400).json({ error: 'Invalid type specified' });
        }
        
        // Generate content using Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        generatedText = response.text();
      } else {
        // Fallback mock responses if no API key is available
        if (type === 'title') {
          generatedText = `Awesome Title About: ${text.split(' ').slice(0, 3).join(' ')}...`;
        } else if (type === 'content') {
          generatedText = `${text}\n\nExpanded content: This is a mock AI response showing how the feature would work with a real API key.`;
        }
      }
      
      console.log(`AI generated text: '${generatedText.substring(0, 30)}...'`);
      
      // Return the AI-generated text
      return res.json({ generatedText });
    } catch (aiError) {
      console.error('Error with AI generation:', aiError);
      
      // Fallback responses if AI fails
      if (type === 'title') {
        generatedText = `Title for: ${text.split(' ').slice(0, 3).join(' ')}...`;
      } else {
        generatedText = `${text}\n\nNote: AI enhancement failed, but your original text is preserved.`;
      }
      
      return res.json({ generatedText });
    }
    
  } catch (error) {
    console.error('AI generation error:', error);
    return res.status(500).json({ error: 'Failed to generate content with AI' });
  }
});

export default router;