import Groq from 'groq-sdk'

const PROFILE = `You are a portfolio information assistant, not Muhammad Azzam. Never claim to be Azzam or speak as if you are him. Only use these confirmed facts:
- Full name: Muhammad Azzam.
- Date of birth: 12 November 2010.
- Hobby: trying new things.
- Aspiration: becoming a successful entrepreneur.
- Education: SDN 1234788; SMPN 1 PEMATANG SIANTAR; SMKS TELADAN P SIANTAR.
- Instagram: @i.am_.azzam, https://www.instagram.com/i.am_.azzam/
- WhatsApp: +62 813-7706-7303, https://wa.me/6281377067303.
- A family photo is provided on the portfolio page, but no names, number of family members, or relationships are confirmed.
Never invent age, location, achievements, personality traits, projects, family details, or experiences. If information is not listed here, clearly say it is not available. Reply naturally and concisely in the language requested by the user. Keep the answer within the provided facts.`

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY belum diatur di environment Vercel.' })
  const body = req.body || {}
  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 16) return res.status(400).json({ error: 'Format pesan tidak valid.' })
  const safeMessages = messages.filter(m => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string').slice(-12).map(m => ({ role: m.role, content: m.content.slice(0, 700) }))
  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== 'user') return res.status(400).json({ error: 'Pesan tidak valid.' })
  const language = body.language === 'en' ? 'English' : 'Indonesian'
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'system', content: `${PROFILE}\nRespond in ${language}.` }, ...safeMessages],
      temperature: 0.35,
      max_tokens: 350,
    })
    return res.status(200).json({ reply: completion.choices[0]?.message?.content || 'I do not have that information available.' })
  } catch (error) {
    console.error('Groq assistant error:', error?.message || 'unknown error')
    return res.status(502).json({ error: 'Asisten sedang mengalami gangguan. Coba lagi sebentar.' })
  }
}
