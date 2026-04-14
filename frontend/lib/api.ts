const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface Business {
  business_id: string;
  name: string;
  address: string;
  area: string;
  city: string;
  categories: string;
  primary_category: string;
  stars: number;
  review_count: number;
  is_open: number;
  is_successful: number;
  latitude: number;
  longitude: number;
  predicted_rating?: number;
  similarity_score?: number;
}

export interface PlatformStats {
  total_businesses: number;
  total_reviews: number;
  total_areas: number;
  total_categories: number;
  avg_rating: number;
  success_rate: number;
}

export interface MarketAnalysis {
  location: string;
  category: string;
  radius_km: number;
  analysis: {
    total_competitors: number;
    density_level: string;
    avg_competitor_rating: number | null;
    total_area_reviews: number;
    demand_indicator: string;
    saturation_score: number;
    recommendation: string;
  };
  top_competitors: { name: string; rating: number; reviews: number; area: string }[];
}

export interface SuccessPrediction {
  success_probability: number;
  risk_level: string;
  recommendation: string;
  confidence: number;
  competitor_count: number;
  avg_competitor_rating: number | null;
  area_total_reviews: number;
  positive_factors: string[];
  negative_factors: string[];
  suggestions: string[];
}

export interface GapAnalysis {
  area: string;
  total_businesses: number;
  opportunities: {
    category: string;
    gap_score: number;
    current_count: number;
    city_avg_count: number;
    avg_rating: number | null;
    potential: string;
    reason: string;
  }[];
}

export interface AreaInsights {
  area: string;
  total_businesses: number;
  avg_rating: number;
  total_reviews: number;
  open_businesses: number;
  successful_businesses: number;
  top_categories: Record<string, number>;
  top_businesses: Business[];
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface ChatResponse {
  reply: string;
  businesses: Business[];
  intent: string;
  suggestions: string[];
}

// ── API calls ────────────────────────────────────────────────────────────────
export const api = {
  stats: () => get<PlatformStats>('/api/stats'),

  businesses: (params?: { page?: number; page_size?: number; area?: string; category?: string; min_stars?: number }) => {
    const q = new URLSearchParams();
    if (params?.page)      q.set('page', String(params.page));
    if (params?.page_size) q.set('page_size', String(params.page_size));
    if (params?.area)      q.set('area', params.area);
    if (params?.category)  q.set('category', params.category);
    if (params?.min_stars !== undefined) q.set('min_stars', String(params.min_stars));
    return get<{ total: number; page: number; page_size: number; businesses: Business[] }>(
      `/api/businesses?${q}`
    );
  },

  search: (q: string, category?: string, area?: string) => {
    const params = new URLSearchParams({ limit: '20' });
    if (q)        params.set('q', q);
    if (category) params.set('category', category);
    if (area)     params.set('area', area);
    return get<{ query: string; total: number; businesses: Business[] }>(`/api/search?${params}`);
  },

  trending: (limit = 12) =>
    get<{ businesses: Business[] }>(`/api/trending?limit=${limit}`),

  recommend: (userId: string, n = 10) =>
    get<{ user_id: string; recommendations: Business[] }>(`/api/recommend/${encodeURIComponent(userId)}?n=${n}`),

  similar: (businessId: string) =>
    get<{ source: Business; similar: Business[] }>(`/api/similar/${encodeURIComponent(businessId)}`),

  business: (id: string) => get<Business>(`/api/business/${encodeURIComponent(id)}`),

  sampleUsers: () => get<{ users: string[] }>('/api/sample-users'),

  areas: () => get<{ areas: string[]; counts: Record<string, number> }>('/api/areas'),

  categories: () => get<{ categories: string[]; counts: Record<string, number> }>('/api/categories'),

  marketAnalysis: (body: { latitude: number; longitude: number; category: string; area_name: string; radius_km?: number }) =>
    post<MarketAnalysis>('/api/market-analysis', body),

  predictSuccess: (body: { latitude: number; longitude: number; category: string; area?: string; radius_km?: number }) =>
    post<SuccessPrediction>('/api/predict-success', body),

  gapAnalysis: (area: string) => get<GapAnalysis>(`/api/gap-analysis/${encodeURIComponent(area)}`),

  areaInsights: (area: string) => get<AreaInsights>(`/api/area-insights/${encodeURIComponent(area)}`),

  competition: (category: string, area: string) =>
    get<{ area: string; category: string; competitor_count: number; avg_rating: number | null; total_reviews: number; competitors: Business[] }>(
      `/api/competition/${encodeURIComponent(category)}/${encodeURIComponent(area)}`
    ),

  chat: (message: string) =>
    post<ChatResponse>('/api/chat', { message }),
};
