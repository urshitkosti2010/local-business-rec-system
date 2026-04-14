"""
Business Success Predictor using Random Forest Classifier.
"""
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from math import radians, cos, sin, asin, sqrt


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return 6371 * c


class BusinessSuccessPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100, max_depth=10, random_state=42, class_weight="balanced"
        )
        self.category_encoder = LabelEncoder()
        self.feature_names = [
            "latitude", "longitude", "category_encoded",
            "competitor_count", "avg_competitor_rating",
            "area_total_reviews", "area_avg_rating"
        ]
        self.trained = False
        self.businesses_df = None
        
    def train(self, businesses_df):
        """Train success prediction model."""
        print("Training Business Success Predictor (Random Forest)...")
        
        self.businesses_df = businesses_df.copy()
        
        # Encode categories
        categories = businesses_df["primary_category"].fillna("Unknown")
        self.category_encoder.fit(categories)
        
        # Prepare features
        X = pd.DataFrame()
        X["latitude"] = businesses_df["latitude"]
        X["longitude"] = businesses_df["longitude"]
        X["category_encoded"] = self.category_encoder.transform(categories)
        X["competitor_count"] = businesses_df["competitor_count"].fillna(0)
        X["avg_competitor_rating"] = businesses_df["avg_competitor_rating"].fillna(3.5)
        X["area_total_reviews"] = businesses_df["total_area_category_reviews"].fillna(0)
        X["area_avg_rating"] = businesses_df["avg_competitor_rating"].fillna(3.5)
        
        y = businesses_df["is_successful"]
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        self.model.fit(X_train, y_train)
        self.trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"  Accuracy: {acc:.3f}")
        print(f"  Feature importances:")
        for name, imp in zip(self.feature_names, self.model.feature_importances_):
            print(f"    {name}: {imp:.3f}")
        
    def get_nearby_businesses(self, lat, lng, category, radius_km=2.0):
        """Get businesses near a location within radius."""
        if self.businesses_df is None:
            return pd.DataFrame()
        
        df = self.businesses_df.copy()
        
        # Filter by category if specified
        if category:
            cat_lower = category.lower()
            df = df[df["categories"].str.lower().str.contains(cat_lower, na=False)]
        
        # Calculate distance
        df["distance_km"] = df.apply(
            lambda r: haversine(lat, lng, r["latitude"], r["longitude"]),
            axis=1
        )
        
        return df[df["distance_km"] <= radius_km]

    def predict_success(self, lat, lng, category, area=None, radius_km=2.0):
        """Predict success probability for a new business."""
        if not self.trained:
            raise ValueError("Model not trained yet")
        
        # Get nearby competitors
        nearby = self.get_nearby_businesses(lat, lng, category, radius_km)
        
        # Encode category
        try:
            cat_encoded = self.category_encoder.transform([category])[0]
        except ValueError:
            cat_encoded = 0  # Unknown category
        
        # Build feature vector
        features = np.array([[
            lat,
            lng,
            cat_encoded,
            len(nearby),
            nearby["stars"].mean() if len(nearby) > 0 else 3.5,
            nearby["review_count"].sum() if len(nearby) > 0 else 0,
            nearby["stars"].mean() if len(nearby) > 0 else 3.5,
        ]])
        
        # Predict
        prob = self.model.predict_proba(features)[0]
        success_prob = round(float(prob[1]) * 100, 1) if len(prob) > 1 else 50.0
        
        # Risk assessment
        if success_prob >= 70:
            risk = "Low"
            recommendation = "Strong potential — Go ahead!"
        elif success_prob >= 50:
            risk = "Medium"
            recommendation = "Moderate potential — Careful planning needed"
        else:
            risk = "High"
            recommendation = "High risk — Reconsider or pivot strategy"
        
        # Key factors
        positive_factors = []
        negative_factors = []
        
        if len(nearby) < 5:
            positive_factors.append(f"Low competition ({len(nearby)} similar businesses nearby)")
        elif len(nearby) > 15:
            negative_factors.append(f"High competition ({len(nearby)} similar businesses nearby)")
        
        area_reviews = nearby["review_count"].sum() if len(nearby) > 0 else 0
        if area_reviews > 500:
            positive_factors.append(f"High area demand ({int(area_reviews)} total reviews)")
        elif area_reviews < 100:
            negative_factors.append(f"Low area demand ({int(area_reviews)} total reviews)")
        
        avg_rating = nearby["stars"].mean() if len(nearby) > 0 else 0
        if avg_rating < 3.5:
            positive_factors.append(f"Low competitor quality (avg {avg_rating:.1f}★) — room for improvement")
        elif avg_rating > 4.2:
            negative_factors.append(f"High competitor quality (avg {avg_rating:.1f}★) — need to match")
        
        return {
            "success_probability": success_prob,
            "risk_level": risk,
            "recommendation": recommendation,
            "confidence": min(85, 60 + len(nearby) * 2),
            "competitor_count": len(nearby),
            "avg_competitor_rating": round(avg_rating, 2) if len(nearby) > 0 else None,
            "area_total_reviews": int(area_reviews),
            "positive_factors": positive_factors if positive_factors else ["Balanced market conditions"],
            "negative_factors": negative_factors if negative_factors else ["No significant negatives identified"],
            "suggestions": [
                "Focus on unique offerings to differentiate",
                "Invest in online presence and reviews",
                "Study top competitors' strengths and gaps",
            ]
        }

    def market_analysis(self, lat, lng, category, area_name, radius_km=2.0):
        """Comprehensive market analysis for a location and category."""
        nearby = self.get_nearby_businesses(lat, lng, category, radius_km)
        
        if len(nearby) == 0:
            density = "Very Low"
            saturation = 5
        elif len(nearby) < 5:
            density = "Low"
            saturation = 20
        elif len(nearby) < 10:
            density = "Medium"
            saturation = 50
        elif len(nearby) < 20:
            density = "High"
            saturation = 75
        else:
            density = "Very High"
            saturation = 95
        
        total_reviews = int(nearby["review_count"].sum()) if len(nearby) > 0 else 0
        demand = "High" if total_reviews > 1000 else "Medium" if total_reviews > 200 else "Low"
        
        top_competitors = []
        if len(nearby) > 0:
            top = nearby.nlargest(5, "review_count")
            for _, row in top.iterrows():
                top_competitors.append({
                    "name": row["name"],
                    "rating": float(row["stars"]),
                    "reviews": int(row["review_count"]),
                    "area": row.get("area", area_name),
                })
        
        return {
            "location": f"{area_name}, Bengaluru",
            "category": category,
            "radius_km": radius_km,
            "analysis": {
                "total_competitors": len(nearby),
                "density_level": density,
                "avg_competitor_rating": round(float(nearby["stars"].mean()), 2) if len(nearby) > 0 else None,
                "total_area_reviews": total_reviews,
                "demand_indicator": demand,
                "saturation_score": saturation,
                "recommendation": f"Market is {'saturated — differentiation required' if saturation > 60 else 'open — good opportunity'}"
            },
            "top_competitors": top_competitors
        }
    
    def gap_analysis(self, area_name):
        """Find business opportunities in an area."""
        if self.businesses_df is None:
            return {"area": area_name, "opportunities": []}
        
        area_biz = self.businesses_df[self.businesses_df["area"] == area_name]
        all_categories = self.businesses_df["primary_category"].value_counts()
        area_categories = area_biz["primary_category"].value_counts()
        
        opportunities = []
        for cat, city_count in all_categories.head(30).items():
            area_count = area_categories.get(cat, 0)
            expected = city_count * len(area_biz) / len(self.businesses_df) if len(self.businesses_df) > 0 else 0
            
            if expected > 2 and area_count < expected * 0.5:
                gap_score = min(100, int((1 - area_count / max(expected, 1)) * 100))
                
                area_cat_biz = area_biz[area_biz["primary_category"] == cat]
                avg_rating = round(float(area_cat_biz["stars"].mean()), 1) if len(area_cat_biz) > 0 else None
                
                opportunities.append({
                    "category": cat,
                    "gap_score": gap_score,
                    "current_count": int(area_count),
                    "city_avg_count": round(float(expected), 1),
                    "avg_rating": avg_rating,
                    "potential": "High" if gap_score > 70 else "Medium" if gap_score > 40 else "Low",
                    "reason": f"Only {int(area_count)} in area vs {round(float(expected), 1)} city average"
                })
        
        opportunities.sort(key=lambda x: x["gap_score"], reverse=True)
        
        return {
            "area": area_name,
            "total_businesses": len(area_biz),
            "opportunities": opportunities[:10]
        }
    
    def save(self, path):
        with open(path, "wb") as f:
            pickle.dump(self, f)
        print(f"  Saved success predictor to {path}")
    
    @staticmethod
    def load(path):
        with open(path, "rb") as f:
            return pickle.load(f)
