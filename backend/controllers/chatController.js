import prisma from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const askAssistant = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        // 1. Fetch recent data to give the AI context (Limit to recent to save tokens)
        const recentReports = await prisma.report.findMany({
            take: 50,
            orderBy: { weekStartDate: 'desc' },
            include: {
                user: { select: { fullName: true } },
                project: { select: { name: true } }
            }
        });

        // 2. Format the data to be easily readable by the AI
        const formattedData = recentReports.map(r => ({
            member: r.user?.fullName,
            project: r.project?.name,
            dates: `${new Date(r.weekStartDate).toLocaleDateString()} to ${new Date(r.weekEndDate).toLocaleDateString()}`,
            completed: r.tasksCompleted,
            blockers: r.blockers || "None",
            status: r.status
        }));

        // 3. Construct the Master Prompt
        const systemInstruction = `
      You are an intelligent, professional AI assistant built directly into a company's Weekly Reporting System. 
      Your job is to answer the engineering manager's questions based strictly on the recent weekly report data provided below.
      Keep your answers concise, formatting them with bullet points where appropriate. 
      If the user asks something unrelated to the reports or company, politely decline and remind them you are a reporting assistant.
      
      HERE IS THE RECENT REPORT DATA:
      ${JSON.stringify(formattedData)}
    `;

        // 4. Call the AI Model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const fullPrompt = `${systemInstruction}\n\nManager's Question: ${message}`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        // 5. Send back to frontend
        res.status(200).json({ reply: responseText });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: 'Failed to communicate with AI Assistant' });
    }
};