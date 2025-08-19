export function apiBase() {
    // Server-side calls inside the container should hit the service name.
    return process.env.API_BASE_INTERNAL
      ?? process.env.NEXT_PUBLIC_API_BASE
      ?? "http://localhost:8000";
  }