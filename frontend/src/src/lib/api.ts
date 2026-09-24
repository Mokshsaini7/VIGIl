export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");


export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "vigil_token"
        )
      : null;


  const headers = new Headers(
    options.headers || {}
  );


  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }


  return fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );
}
