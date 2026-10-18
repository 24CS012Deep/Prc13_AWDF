const express = require('express');
const router = express.Router();

// Simple in-memory rate limiting map (IP -> timestamp)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds per request

/**
 * Intelligent Fallback Heuristic Generator
 * Guarantees graceful degradation when external AI APIs fail, time out, or lack API keys.
 */
function generateContextualFallback(title) {
  const lower = title.toLowerCase();
  let description = '';
  let priority = 'medium';

  // Calculate a reasonable proposed deadline (3 days from now)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  const deadline = targetDate.toISOString().split('T')[0];

  if (lower.includes('auth') || lower.includes('security') || lower.includes('login') || lower.includes('jwt')) {
    description = `Implement and verify secure authentication workflows for "${title}". Ensure salted password hashing, stateless token verification, and strict route authorization middleware.`;
    priority = 'high';
  } else if (lower.includes('docker') || lower.includes('container') || lower.includes('compose')) {
    description = `Configure containerized multi-stage build pipelines for "${title}". Verify port forwarding, service isolation, and persistent volume mounts.`;
    priority = 'high';
  } else if (lower.includes('cache') || lower.includes('performance') || lower.includes('optimize')) {
    description = `Analyze query bottlenecks and implement in-memory caching for "${title}". Establish TTL bounds and ensure automated write-through invalidation.`;
    priority = 'medium';
  } else if (lower.includes('test') || lower.includes('ci') || lower.includes('pipeline')) {
    description = `Write comprehensive integration test assertions for "${title}". Validate edge cases, HTTP error codes, and verify pipeline automation.`;
    priority = 'medium';
  } else if (lower.includes('frontend') || lower.includes('ui') || lower.includes('react')) {
    description = `Design clean, responsive user interfaces for "${title}". Ensure single responsibility component decomposition, accessibility, and state synchronization.`;
    priority = 'low';
  } else {
    description = `Execute actionable development milestones for "${title}". Break down implementation tasks, verify edge cases, and conduct code review.`;
    priority = 'medium';
  }

  return {
    description,
    suggestedPriority: priority,
    suggestedDeadline: deadline,
    fallback: true
  };
}

/**
 * POST /api/ai/suggest & POST /api/ai/generate-description
 * Secure server-side AI endpoint that calls external LLM (Gemini/OpenAI)
 * with graceful degradation fallback.
 */
const handleAISuggestion = async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'client';
  const now = Date.now();

  // Rate Limiting Check
  if (rateLimitMap.has(clientIp)) {
    const lastRequest = rateLimitMap.get(clientIp);
    if (now - lastRequest < RATE_LIMIT_WINDOW_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequest)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Rate Limit Exceeded',
        message: `Please wait ${waitSeconds}s before requesting another AI generation.`
      });
    }
  }
  rateLimitMap.set(clientIp, now);

  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required to generate description.'
    });
  }

  const apiKey = process.env.AI_API_KEY;

  // Format response helper
  const sendAIResponse = (description, priority, fallback, provider, model) => {
    const formattedPriority = priority.charAt(0).toUpperCase() + priority.slice(1);
    return res.status(200).json({
      success: true,
      data: {
        description,
        priority: formattedPriority
      },
      description,
      suggestedPriority: formattedPriority,
      meta: {
        fallback,
        provider,
        model: model || provider,
        source: fallback ? 'Contextual Engine (Graceful Fallback)' : provider
      },
      disclaimer: 'Note: AI-generated suggestion. Please review and modify before saving.'
    });
  };

  // If no API key configured or placeholder present, immediately use intelligent fallback
  if (!apiKey || apiKey === 'your_gemini_or_openai_api_key_here') {
    const fallbackResult = generateContextualFallback(title.trim());
    return sendAIResponse(
      fallbackResult.description,
      fallbackResult.suggestedPriority,
      true,
      'Contextual Fallback Engine',
      'heuristic-nlp'
    );
  }

  try {
    const provider = process.env.AI_PROVIDER || 'gemini';
    let generatedText = '';

    if (provider === 'gemini') {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an engineering assistant. Provide a concise 2-sentence task description and suggest priority (Low, Medium, High) for a software engineering task titled: "${title}". Return output in format: Description: <text> | Priority: <priority>`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const result = await response.json();
      generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Write a short, professional 2-sentence task description and suggest priority (Low, Medium, High) for: "${title}".`
            }
          ],
          max_tokens: 120
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const result = await response.json();
      generatedText = result.choices?.[0]?.message?.content || '';
    }

    const priorityGuess = generatedText.toLowerCase().includes('high') ? 'High' : 'Medium';
    return sendAIResponse(generatedText.trim(), priorityGuess, false, provider.toUpperCase(), provider);
  } catch (err) {
    console.warn(`[AI API Notice] External API call failed (${err.message}). Activating graceful degradation.`);
    const fallbackResult = generateContextualFallback(title.trim());
    return sendAIResponse(
      fallbackResult.description,
      fallbackResult.suggestedPriority,
      true,
      'Contextual Fallback Engine (API Timeout/Degraded)',
      'heuristic-nlp'
    );
  }
};

router.post('/suggest', handleAISuggestion);
router.post('/generate-description', handleAISuggestion);

module.exports = router;
