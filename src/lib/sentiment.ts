import { SentimentScores } from '../types';

export const mapSentimentToScore = (text: string): SentimentScores => {
  const lowerText = text.toLowerCase();
  
  // Base scores
  let confidence = 50;
  let skepticism = 30;
  let interest = 40;

  // Confidence indicators
  if (lowerText.includes('definitely') || lowerText.includes('certainly') || lowerText.includes('strong')) confidence += 15;
  if (lowerText.includes('maybe') || lowerText.includes('perhaps') || lowerText.includes('unsure')) confidence -= 15;
  if (lowerText.includes('proven') || lowerText.includes('validated') || lowerText.includes('traction')) confidence += 10;
  
  // Skepticism indicators
  if (lowerText.includes('but') || lowerText.includes('however') || lowerText.includes('risk') || lowerText.includes('challenge')) skepticism += 20;
  if (lowerText.includes('agree') || lowerText.includes('solid') || lowerText.includes('clear')) skepticism -= 15;
  if (lowerText.includes('unclear') || lowerText.includes('vague') || lowerText.includes('doubt')) skepticism += 15;

  // Interest indicators
  if (lowerText.includes('interesting') || lowerText.includes('fascinating') || lowerText.includes('tell me more') || lowerText.includes('opportunity')) interest += 25;
  if (lowerText.includes('boring') || lowerText.includes('standard') || lowerText.includes('common')) interest -= 10;
  if (lowerText.includes('invest') || lowerText.includes('next steps') || lowerText.includes('follow up')) interest += 20;

  // Clamp values between 0 and 100
  return {
    confidence: Math.min(100, Math.max(5, confidence)),
    skepticism: Math.min(100, Math.max(5, skepticism)),
    interest: Math.min(100, Math.max(5, interest))
  };
};
