const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface WaitlistRequest {
  email: string;
  name?: string;
  source?: string;
}

interface WaitlistResponse {
  data: {
    message: string;
    alreadySubscribed: boolean;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

export async function subscribeToWaitlist(data: WaitlistRequest): Promise<WaitlistResponse> {
  const response = await fetch(`${API_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' },
    }));
    throw new Error(error.error?.message || 'Something went wrong. Please try again.');
  }

  return response.json();
}
