import { API_KEYS, VARIABLES } from '@config';

interface Route {
  url: (params: any) => string;
  method: string;
}

const routes: Record<string, Route> = {
  [API_KEYS.GET_PROJECTS]: {
    url: () => '/v1/project',
    method: 'GET',
  },
  [API_KEYS.CREATE_PROJECT]: {
    url: () => '/v1/project',
    method: 'POST',
  },
  [API_KEYS.LOGOUT]: {
    url: () => '/v1/auth/logout',
    method: 'GET',
  },
};

function handleResponseStatusAndContentType(response: Response) {
  const contentType = response.headers.get('content-type');

  if (contentType === null) return Promise.resolve(null);
  else if (contentType.startsWith('application/json;')) return response.json();
  else if (contentType.startsWith('text/plain;')) return response.text();
  else throw new Error(`Unsupported response content-type: ${contentType}`);
}

export async function commonApi(
  key: keyof typeof API_KEYS,
  { parameters, body }: { parameters?: string[]; body?: any }
) {
  try {
    const route = routes[key];
    const url = process.env.NEXT_PUBLIC_API_BASE_URL + route.url(parameters);
    const method = route.method;

    const response = await fetch(url, {
      method,
      body: JSON.stringify(body),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status >= VARIABLES.TWO_HUNDREDS && response.status < VARIABLES.THREE_HUNDREDS) {
      return handleResponseStatusAndContentType(response);
    }
  } catch (error) {
    throw error;
  }
}
