/**
 * Simple in-memory rate limiter for Next.js API Routes.
 * Note: In a true distributed serverless environment, this limit applies per-instance.
 * For a production app with multiple instances, consider using Redis (e.g., Upstash).
 */

const rateLimitMap = new Map();

export default function rateLimit({ interval, uniqueTokenPerInterval }) {
  return {
    check: (limit, token) =>
      new Promise((resolve, reject) => {
        const tokenCount = rateLimitMap.get(token) || [0];
        if (tokenCount[0] === 0) {
          rateLimitMap.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit; // Allow up to 'limit' requests

        // Reset the token count after the interval
        if (currentUsage === 1) {
          setTimeout(() => {
            rateLimitMap.delete(token);
          }, interval);
        }

        // To prevent map from growing infinitely (e.g. DDOS)
        if (rateLimitMap.size > uniqueTokenPerInterval) {
          // Clear map to avoid memory leak under attack
          rateLimitMap.clear();
        }

        if (isRateLimited) {
          return reject(new Error('Rate limit exceeded'));
        }
        return resolve();
      }),
  };
}
