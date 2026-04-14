"""
Bengaluru Business Intelligence - FastAPI Backend
"""
import os
import sys
import re
import pickle
import random
import pandas as pd
import numpy as np
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to path so we can import models
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.collaborative_filter import CollaborativeFilter
from models.content_based import ContentBasedFilter
from models.success_predictor import BusinessSuccessPredictor

# ── Paths ───────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(ROOT, "data")
MODELS_DIR = os.path.join(ROOT, "models", "saved")

# ── Global state (loaded on startup) ────────────────────────────────────────
class AppState:
    businesses: pd.DataFrame = None
    reviews: pd.DataFrame = None
    area_stats: pd.DataFrame = None
    cf_model: CollaborativeFilter = None
    cb_model: ContentBasedFilter = None
    sp_model: BusinessSuccessPredictor = None
    areas: list = []
    categories: list = []
    business_ids: list = []

state = AppState()


def load_data_and_models():
    """Load data and models into memory at startup."""
    print("Loading data...")
    state.businesses = pd.read_pickle(os.path.join(DATA_DIR, "processed_businesses.pkl"))
    state.reviews = pd.read_pickle(os.path.join(DATA_DIR, "processed_reviews.pkl"))

    area_stats_path = os.path.join(DATA_DIR, "area_stats.pkl")
    if os.path.exists(area_stats_path):
        state.area_stats = pd.read_pickle(area_stats_path)

    state.areas = sorted(state.businesses["area"].dropna().unique().tolist())
    state.categories = sorted(
        state.businesses["primary_category"].dropna().unique().tolist()
    )
    state.business_ids = state.businesses["business_id"].tolist()
    print(f"  Loaded {len(state.businesses)} businesses, {len(state.reviews)} reviews")

    # Load ML models if saved
    cf_path = os.path.join(MODELS_DIR, "collaborative_filter.pkl")
    cb_path = os.path.join(MODELS_DIR, "content_based.pkl")
    sp_path = os.path.join(MODELS_DIR, "success_predictor.pkl")

    if os.path.exists(cf_path):
        state.cf_model = CollaborativeFilter.load(cf_path)
        print("  Loaded collaborative filter model")
    else:
        print("  [WARN] No collaborative filter model found — run train_models.py")

    if os.path.exists(cb_path):
        state.cb_model = ContentBasedFilter.load(cb_path)
        print("  Loaded content-based filter model")
    else:
        print("  [WARN] No content-based filter model found — run train_models.py")

    if os.path.exists(sp_path):
        state.sp_model = BusinessSuccessPredictor.load(sp_path)
        print("  Loaded success predictor model")
    else:
        # Train on-the-fly if not saved
        print("  Training success predictor on-the-fly...")
        state.sp_model = BusinessSuccessPredictor()
        state.sp_model.train(state.businesses)


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_data_and_models()
    yield


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Bengaluru Business Intelligence API",
    description="AI-powered business intelligence platform for Bengaluru",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ──────────────────────────────────────────────────────────────────
def business_to_dict(row: pd.Series) -> dict:
    """Convert a business DataFrame row to a JSON-serialisable dict."""
    return {
        "business_id": str(row.get("business_id", "")),
        "name": str(row.get("name", "")),
        "address": str(row.get("address", "")),
        "area": str(row.get("area", "")),
        "city": "Bengaluru",
        "categories": str(row.get("categories", "")),
        "primary_category": str(row.get("primary_category", "")),
        "stars": float(row.get("stars", 0)),
        "review_count": int(row.get("review_count", 0)),
        "is_open": int(row.get("is_open", 1)),
        "is_successful": int(row.get("is_successful", 0)),
        "latitude": float(row.get("latitude", 0)),
        "longitude": float(row.get("longitude", 0)),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  CONSUMER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/businesses")
def list_businesses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    area: Optional[str] = None,
    category: Optional[str] = None,
    min_stars: Optional[float] = None,
):
    """List / paginate businesses with optional filters."""
    df = state.businesses

    if area:
        df = df[df["area"].str.lower() == area.lower()]
    if category:
        df = df[df["categories"].str.lower().str.contains(category.lower(), na=False)]
    if min_stars is not None:
        df = df[df["stars"] >= min_stars]

    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "businesses": [business_to_dict(row) for _, row in page_df.iterrows()],
    }


@app.get("/api/search")
def search_businesses(
    q: Optional[str] = None,
    category: Optional[str] = None,
    area: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Search businesses by name/category with optional area filter."""
    df = state.businesses

    if q:
        mask = df["name"].str.lower().str.contains(q.lower(), na=False)
        if category is None:
            mask |= df["categories"].str.lower().str.contains(q.lower(), na=False)
        df = df[mask]
    if category:
        df = df[df["categories"].str.lower().str.contains(category.lower(), na=False)]
    if area:
        df = df[df["area"].str.lower() == area.lower()]

    df = df.sort_values("stars", ascending=False).head(limit)

    return {
        "query": q,
        "total": len(df),
        "businesses": [business_to_dict(row) for _, row in df.iterrows()],
    }


@app.get("/api/trending")
def trending_businesses(limit: int = Query(12, ge=1, le=50)):
    """Get trending businesses (high review count + high rating)."""
    df = state.businesses.copy()
    df["trend_score"] = (
        df["stars"] * 0.4 + np.log1p(df["review_count"]) * 0.6
    )
    top = df.nlargest(limit, "trend_score")
    return {
        "businesses": [business_to_dict(row) for _, row in top.iterrows()]
    }


@app.get("/api/recommend/{user_id}")
def recommend_for_user(user_id: str, n: int = Query(10, ge=1, le=50)):
    """Personalized recommendations using collaborative filtering."""
    if state.cf_model is None:
        raise HTTPException(503, "Collaborative filter model not loaded. Run train_models.py")

    recommendations = state.cf_model.recommend(user_id, state.business_ids, n=n)

    if not recommendations:
        raise HTTPException(404, f"User ID '{user_id}' not found in model")

    result_businesses = []
    for business_id, predicted_rating in recommendations:
        row = state.businesses[state.businesses["business_id"] == business_id]
        if len(row) > 0:
            d = business_to_dict(row.iloc[0])
            d["predicted_rating"] = round(predicted_rating, 2)
            result_businesses.append(d)

    return {
        "user_id": user_id,
        "recommendations": result_businesses,
    }


@app.get("/api/similar/{business_id}")
def similar_businesses(business_id: str, n: int = Query(8, ge=1, le=30)):
    """Content-based similar businesses."""
    if state.cb_model is None:
        raise HTTPException(503, "Content-based filter model not loaded. Run train_models.py")

    similar = state.cb_model.get_similar(business_id, n=n)
    if not similar:
        raise HTTPException(404, f"Business ID '{business_id}' not found in model")

    results = []
    for bid, score in similar:
        row = state.businesses[state.businesses["business_id"] == bid]
        if len(row) > 0:
            d = business_to_dict(row.iloc[0])
            d["similarity_score"] = round(score, 3)
            results.append(d)

    # Also return the source business
    src_row = state.businesses[state.businesses["business_id"] == business_id]
    source = business_to_dict(src_row.iloc[0]) if len(src_row) > 0 else {}

    return {"source": source, "similar": results}


@app.get("/api/business/{business_id}")
def get_business(business_id: str):
    """Get full details of a single business."""
    row = state.businesses[state.businesses["business_id"] == business_id]
    if len(row) == 0:
        raise HTTPException(404, "Business not found")
    return business_to_dict(row.iloc[0])


@app.get("/api/sample-users")
def sample_users(limit: int = 20):
    """Return sample user IDs that have enough reviews for recommendations."""
    # Prefer the CF model's known users — these are guaranteed to produce recs
    if state.cf_model is not None:
        sample = state.cf_model.get_known_users()[:limit]
    else:
        user_ids_path = os.path.join(DATA_DIR, "user_ids.pkl")
        if os.path.exists(user_ids_path):
            with open(user_ids_path, "rb") as f:
                user_ids = pickle.load(f)
            sample = list(user_ids)[:limit]
        else:
            sample = state.reviews["user_id"].value_counts().head(limit).index.tolist()
    return {"users": sample}


# ═══════════════════════════════════════════════════════════════════════════════
#  BUSINESS OWNER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class MarketAnalysisRequest(BaseModel):
    latitude: float
    longitude: float
    category: str
    area_name: str
    radius_km: float = 2.0


class SuccessPredictRequest(BaseModel):
    latitude: float
    longitude: float
    category: str
    area: Optional[str] = None
    radius_km: float = 2.0


@app.post("/api/market-analysis")
def market_analysis(req: MarketAnalysisRequest):
    """Market saturation analysis for a location and category."""
    if state.sp_model is None:
        raise HTTPException(503, "Predictor model not loaded")
    result = state.sp_model.market_analysis(
        req.latitude, req.longitude, req.category, req.area_name, req.radius_km
    )
    return result


@app.post("/api/predict-success")
def predict_success(req: SuccessPredictRequest):
    """Predict business success probability for a new business."""
    if state.sp_model is None:
        raise HTTPException(503, "Predictor model not loaded")
    result = state.sp_model.predict_success(
        req.latitude, req.longitude, req.category, req.area, req.radius_km
    )
    return result


@app.get("/api/gap-analysis/{area}")
def gap_analysis(area: str):
    """Find business opportunity gaps in a specific area."""
    if state.sp_model is None:
        raise HTTPException(503, "Predictor model not loaded")
    result = state.sp_model.gap_analysis(area)
    if result["opportunities"] == [] and area not in state.areas:
        raise HTTPException(404, f"Area '{area}' not found")
    return result


@app.get("/api/competition/{category}/{area}")
def competition_density(category: str, area: str):
    """Get competition density for a category in an area."""
    df = state.businesses
    area_df = df[df["area"].str.lower() == area.lower()]
    cat_df = area_df[area_df["categories"].str.lower().str.contains(category.lower(), na=False)]

    competitors = [business_to_dict(row) for _, row in cat_df.nlargest(20, "review_count").iterrows()]

    return {
        "area": area,
        "category": category,
        "competitor_count": len(cat_df),
        "avg_rating": round(float(cat_df["stars"].mean()), 2) if len(cat_df) > 0 else None,
        "total_reviews": int(cat_df["review_count"].sum()) if len(cat_df) > 0 else 0,
        "competitors": competitors,
    }


@app.get("/api/area-insights/{area}")
def area_insights(area: str):
    """Statistics and top businesses for an area."""
    df = state.businesses
    area_df = df[df["area"].str.lower() == area.lower()]

    if len(area_df) == 0:
        raise HTTPException(404, f"Area '{area}' not found")

    top_cats = area_df["primary_category"].value_counts().head(10).to_dict()
    top_businesses = area_df.nlargest(5, "review_count")

    return {
        "area": area,
        "total_businesses": len(area_df),
        "avg_rating": round(float(area_df["stars"].mean()), 2),
        "total_reviews": int(area_df["review_count"].sum()),
        "open_businesses": int(area_df["is_open"].sum()),
        "successful_businesses": int(area_df["is_successful"].sum()),
        "top_categories": top_cats,
        "top_businesses": [business_to_dict(row) for _, row in top_businesses.iterrows()],
    }


@app.get("/api/areas")
def get_areas():
    """List all available Bengaluru areas."""
    areas_with_counts = (
        state.businesses.groupby("area")
        .size()
        .reset_index(name="business_count")
        .sort_values("business_count", ascending=False)
    )
    return {
        "areas": areas_with_counts["area"].tolist(),
        "counts": areas_with_counts.set_index("area")["business_count"].to_dict(),
    }


@app.get("/api/categories")
def get_categories():
    """List all available business categories (primary)."""
    cat_counts = (
        state.businesses["primary_category"]
        .value_counts()
        .head(100)
    )
    return {
        "categories": cat_counts.index.tolist(),
        "counts": cat_counts.to_dict(),
    }


@app.get("/api/stats")
def platform_stats():
    """Platform-wide statistics."""
    return {
        "total_businesses": len(state.businesses),
        "total_reviews": len(state.reviews),
        "total_areas": len(state.areas),
        "total_categories": len(state.categories),
        "avg_rating": round(float(state.businesses["stars"].mean()), 2),
        "success_rate": round(float(state.businesses["is_successful"].mean() * 100), 1),
    }


@app.get("/health")
def health():
    return {"status": "ok", "city": "Bengaluru"}


# ═══════════════════════════════════════════════════════════════════════════════
#  AI CHAT ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []


# ── Area coordinate map (centre-points for prediction) ───────────────────────
AREA_COORDS = {
    "indiranagar":   (12.9784, 77.6408),
    "koramangala":   (12.9352, 77.6245),
    "whitefield":    (12.9698, 77.7500),
    "hsr layout":    (12.9116, 77.6389),
    "mg road":       (12.9750, 77.6066),
    "jayanagar":     (12.9308, 77.5838),
    "btm layout":    (12.9166, 77.6101),
    "electronic city": (12.8399, 77.6770),
    "marathahalli":  (12.9591, 77.6974),
    "jp nagar":      (12.9078, 77.5836),
    "bannerghatta":  (12.8932, 77.5975),
    "hebbal":        (13.0358, 77.5970),
    "malleshwaram":  (13.0027, 77.5646),
    "rajajinagar":   (12.9918, 77.5554),
    "yelahanka":     (13.1007, 77.5963),
    "yeshwanthpur":  (13.0264, 77.5520),
    "banashankari":  (12.9258, 77.5469),
    "bellandur":     (12.9353, 77.6801),
    "sarjapur":      (12.8555, 77.6857),
    "kr puram":      (13.0085, 77.6905),
}

FOOD_CATEGORIES = [
    "restaurant", "cafe", "food", "pizza", "burger", "biryani", "sushi",
    "chinese", "italian", "indian", "mexican", "thai", "japanese", "korean",
    "bakery", "dessert", "ice cream", "bar", "pub", "coffee", "tea", "diner",
    "fast food", "street food", "vegetarian", "vegan", "seafood",
]


def _extract_area(text: str) -> Optional[str]:
    """Find a Bengaluru area name in free text."""
    t = text.lower()
    # check known area coords first
    for area in AREA_COORDS:
        if area in t:
            return area.title()
    # check the live areas list
    if state.areas:
        for area in state.areas:
            if area.lower() in t:
                return area
    return None


def _extract_category(text: str) -> Optional[str]:
    """Find a food/business category in free text."""
    t = text.lower()
    for cat in FOOD_CATEGORIES:
        if cat in t:
            return cat
    # check categories in the dataset
    if state.categories:
        for cat in state.categories:
            if cat.lower() in t:
                return cat
    return None


def _extract_business_name(text: str) -> Optional[str]:
    """Extract a business name after 'similar to' / 'like' pattern."""
    m = re.search(r'similar to ([\w\s]+?)(?:\?|$|,)', text, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r'like ([A-Z][\w\s]+?)(?:\?|$|,)', text)
    if m:
        return m.group(1).strip()
    return None


def _suggestions_for(intent: str, area: Optional[str] = None, category: Optional[str] = None) -> List[str]:
    chips = []
    if intent == "find_restaurants":
        chips = [
            "What's trending this week?",
            f"How competitive is {category or 'this category'} in {area or 'Bengaluru'}?",
            "Should I open a restaurant in Koramangala?",
        ]
    elif intent == "trending":
        chips = [
            "Find Italian restaurants near Indiranagar",
            "Show me top cafes in Koramangala",
            "How many pizza places in Whitefield?",
        ]
    elif intent == "business_advice":
        chips = [
            "What are the market gaps in Indiranagar?",
            f"How many {category or 'restaurants'} are in {area or 'Koramangala'}?",
            "What's trending this week?",
        ]
    elif intent == "count_query":
        chips = [
            "What's trending this week?",
            "Should I open a restaurant here?",
            "Find top cafes in Bengaluru",
        ]
    elif intent == "similar":
        chips = [
            "What's trending this week?",
            "Find Italian restaurants near Indiranagar",
        ]
    else:
        chips = [
            "Find Italian restaurants near Indiranagar",
            "What are the trending cafes this week?",
            "Should I open a Japanese restaurant in Koramangala?",
        ]
    return chips[:3]


@app.post("/api/chat")
def chat(req: ChatRequest):
    """AI chat endpoint — routes natural-language queries to business data APIs."""
    msg = req.message.strip()
    low = msg.lower()

    area = _extract_area(msg)
    category = _extract_category(msg)

    # ── Intent detection ─────────────────────────────────────────────────────

    # 1. Similar businesses
    is_similar = bool(re.search(r'similar to|like\s+[A-Z]|restaurants like', low))

    # 2. Count / competition query
    is_count = bool(re.search(r'how many|count of|number of|how much competition', low))

    # 3. Business owner advice
    is_advice = bool(re.search(
        r'should i open|should i start|can i open|good idea to open|'
        r'open a|start a.*restaurant|start a.*cafe|open.*business|'
        r'market gap|opportunity|success|predict', low
    ))

    # 4. Trending
    is_trending = bool(re.search(
        r'trending|popular|hot spot|most visited|this week|top rated|best rated', low
    ))

    # 5. Area insights ("tell me about X area")
    is_area = bool(re.search(r'tell me about|what about|insights? (for|in|about)|how is', low))

    # 6. Find / search
    is_find = bool(re.search(
        r'find|show|search|get me|near|in [a-z]+|restaurants|cafes|coffee|pizza|burger', low
    ))

    # ── Route intent ─────────────────────────────────────────────────────────
    reply = ""
    businesses_out = []
    intent = "fallback"

    # --- Similar businesses ---
    if is_similar and not is_advice:
        intent = "similar"
        biz_name = _extract_business_name(msg)
        match = None
        if biz_name:
            name_lower = biz_name.lower()
            match_df = state.businesses[
                state.businesses["name"].str.lower().str.contains(name_lower, na=False)
            ]
            match = match_df.iloc[0] if len(match_df) > 0 else None

        if match is not None and state.cb_model is not None:
            similar = state.cb_model.get_similar(match["business_id"], n=6)
            for bid, score in similar:
                row = state.businesses[state.businesses["business_id"] == bid]
                if len(row) > 0:
                    d = business_to_dict(row.iloc[0])
                    d["similarity_score"] = round(score, 3)
                    businesses_out.append(d)
            reply = (
                f"Here are businesses similar to **{match['name']}** "
                f"(⭐ {match['stars']}) in Bengaluru:"
            )
        else:
            # fall through to search
            is_find = True
            intent = "find_restaurants"

    # --- Count / competition ---
    if is_count and not businesses_out:
        intent = "count_query"
        cat_label = category or "restaurant"
        area_label = area or "Bengaluru"
        df = state.businesses
        if area:
            df = df[df["area"].str.lower() == area.lower()]
        if category:
            df = df[df["categories"].str.lower().str.contains(category.lower(), na=False)]
        total = len(df)
        avg_stars = round(float(df["stars"].mean()), 2) if total > 0 else 0
        reply = (
            f"There are **{total} {cat_label} places** in {area_label}."
            f" Average rating: ⭐ {avg_stars}."
        )
        businesses_out = [
            business_to_dict(row)
            for _, row in df.nlargest(6, "review_count").iterrows()
        ]
        if businesses_out:
            reply += f" Here are the most popular ones:"

    # --- Business advice ---
    elif is_advice and not businesses_out:
        intent = "business_advice"
        cat_label = category or "restaurant"
        area_label = area or "Koramangala"
        area_key = area_label.lower()

        lat, lng = AREA_COORDS.get(area_key, (12.9352, 77.6245))

        advice_parts = []

        # Gap analysis
        if state.sp_model:
            try:
                gap = state.sp_model.gap_analysis(area_label)
                opps = gap.get("opportunities", [])
                if opps:
                    top_opp = opps[0]
                    advice_parts.append(
                        f"📊 Top opportunity in {area_label}: **{top_opp['category']}** "
                        f"({top_opp['reason']})."
                    )
            except Exception:
                pass

        # Success prediction
        if state.sp_model:
            try:
                pred = state.sp_model.predict_success(lat, lng, cat_label, area_label, 2.0)
                prob = pred.get("success_probability", 0)
                risk = pred.get("risk_level", "medium")
                rec = pred.get("recommendation", "")
                pos = pred.get("positive_factors", [])
                neg = pred.get("negative_factors", [])
                advice_parts.append(
                    f"🎯 Opening a **{cat_label}** in **{area_label}**: "
                    f"{prob}% success probability ({risk} risk). {rec}"
                )
                if pos:
                    advice_parts.append("✅ Positives: " + "; ".join(pos[:2]))
                if neg:
                    advice_parts.append("⚠️ Risks: " + "; ".join(neg[:2]))
            except Exception:
                pass

        if advice_parts:
            reply = "\n\n".join(advice_parts)
        else:
            reply = (
                f"Based on the Bengaluru market data, opening a **{cat_label}** "
                f"in **{area_label}** is a significant decision. "
                "Here are the top existing competitors in that area:"
            )

        # Show competitors
        comp_df = state.businesses
        if area:
            comp_df = comp_df[comp_df["area"].str.lower() == area.lower()]
        if category:
            comp_df = comp_df[
                comp_df["categories"].str.lower().str.contains(category.lower(), na=False)
            ]
        businesses_out = [
            business_to_dict(row)
            for _, row in comp_df.nlargest(5, "review_count").iterrows()
        ]
        if businesses_out:
            reply += f"\n\nHere's who you'd compete with in {area_label}:"

    # --- Trending ---
    elif is_trending and not businesses_out:
        intent = "trending"
        df = state.businesses.copy()
        if area:
            df = df[df["area"].str.lower() == area.lower()]
        if category:
            df = df[df["categories"].str.lower().str.contains(category.lower(), na=False)]
        df["trend_score"] = df["stars"] * 0.4 + np.log1p(df["review_count"]) * 0.6
        top = df.nlargest(8, "trend_score")
        businesses_out = [business_to_dict(row) for _, row in top.iterrows()]
        area_str = f" in {area}" if area else " across Bengaluru"
        cat_str = f" {category}" if category else ""
        reply = f"🔥 Here are the trending{cat_str} spots{area_str} right now:"

    # --- Area insights ---
    elif is_area and area and not businesses_out:
        intent = "area_insights"
        area_df = state.businesses[state.businesses["area"].str.lower() == area.lower()]
        total = len(area_df)
        avg_r = round(float(area_df["stars"].mean()), 2) if total > 0 else 0
        top_cat = area_df["primary_category"].value_counts().head(3).index.tolist()
        businesses_out = [
            business_to_dict(row)
            for _, row in area_df.nlargest(6, "review_count").iterrows()
        ]
        reply = (
            f"📍 **{area}** has **{total} businesses** with an avg rating of ⭐ {avg_r}. "
            f"Top categories: {', '.join(top_cat)}. Here are the most popular spots:"
        )

    # --- Find / search (default) ---
    if not businesses_out or is_find and not businesses_out:
        intent = "find_restaurants"
        search_df = state.businesses
        if area:
            search_df = search_df[search_df["area"].str.lower() == area.lower()]
        if category:
            search_df = search_df[
                search_df["categories"].str.lower().str.contains(category.lower(), na=False)
            ]
        if not area and not category:
            # generic keyword search on name
            words = [w for w in low.split() if len(w) > 3 and w not in (
                "find", "show", "near", "what", "where", "tell",
                "best", "good", "open", "that", "have", "with",
            )]
            for w in words:
                tmp = search_df[
                    search_df["name"].str.lower().str.contains(w, na=False) |
                    search_df["categories"].str.lower().str.contains(w, na=False)
                ]
                if len(tmp) > 0:
                    search_df = tmp
                    break
        businesses_out = [
            business_to_dict(row)
            for _, row in search_df.nlargest(8, "stars").iterrows()
        ]
        if not reply:
            area_str = f" near {area}" if area else " in Bengaluru"
            cat_str = f" {category}" if category else ""
            reply = (
                f"Found **{len(businesses_out)}{cat_str} places{area_str}**. "
                "Here are the top-rated ones:"
            ) if businesses_out else (
                f"I couldn't find specific results for your query. "
                "Try searching for a category (pizza, cafe, restaurant) and an area name."
            )

    return {
        "reply": reply,
        "businesses": businesses_out[:8],
        "intent": intent,
        "suggestions": _suggestions_for(intent, area, category),
    }
