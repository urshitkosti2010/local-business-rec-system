"""
Data Processor: Loads Yelp dataset, filters/remaps to Bengaluru, engineers features.
"""
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.cluster import DBSCAN

# --- Configuration ---
RAW_DATA_DIR = r"D:\Yelp_Dataset"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
SOURCE_CITY = "Philadelphia"

# Bengaluru center coordinates
BLR_CENTER_LAT = 12.9716
BLR_CENTER_LNG = 77.5946

# Philadelphia center for offset calculation
PHL_CENTER_LAT = 39.9526
PHL_CENTER_LNG = -75.1652

# Neighborhood remapping: Philadelphia → Bengaluru areas
# We'll cluster by zip/neighborhood and remap
AREA_REMAP = {
    "Center City": "MG Road",
    "Fishtown": "Koramangala",
    "Northern Liberties": "Indiranagar",
    "University City": "Electronic City",
    "Old City": "Jayanagar",
    "Manayunk": "Whitefield",
    "Chestnut Hill": "HSR Layout",
    "South Philadelphia": "BTM Layout",
    "Germantown": "Marathahalli",
    "Rittenhouse": "Sadashivanagar",
    "Kensington": "JP Nagar",
    "West Philadelphia": "Rajajinagar",
    "Graduate Hospital": "Malleshwaram",
    "Fairmount": "Basavanagudi",
    "Brewerytown": "Hebbal",
    "Spring Garden": "Yelahanka",
    "Bella Vista": "Banashankari",
    "Queen Village": "Vijayanagar",
    "Point Breeze": "Wilson Garden",
    "East Falls": "Domlur",
}

# Default area assignment based on lat clusters
BENGALURU_AREAS = [
    "MG Road", "Koramangala", "Indiranagar", "Electronic City", "Jayanagar",
    "Whitefield", "HSR Layout", "BTM Layout", "Marathahalli", "Sadashivanagar",
    "JP Nagar", "Rajajinagar", "Malleshwaram", "Basavanagudi", "Hebbal",
    "Yelahanka", "Banashankari", "Vijayanagar", "Wilson Garden", "Domlur",
    "Bellandur", "Sarjapur Road", "Hennur", "RT Nagar", "Bannerghatta Road"
]


def load_raw_data():
    """Load raw CSV files from Yelp dataset."""
    print("Loading raw data...")
    
    business = pd.read_csv(
        os.path.join(RAW_DATA_DIR, "business.csv"),
        encoding="utf-8"
    )
    print(f"  Loaded {len(business)} businesses")
    
    # For reviews, only load columns we need and limit to relevant businesses
    review = pd.read_csv(
        os.path.join(RAW_DATA_DIR, "review.csv"),
        encoding="utf-8",
        usecols=["review_id", "business_id", "user_id", "stars", "text"],
        nrows=500000  # Limit for memory - enough for our city
    )
    print(f"  Loaded {len(review)} reviews")
    
    user = pd.read_csv(
        os.path.join(RAW_DATA_DIR, "user.csv"),
        encoding="utf-8",
        usecols=["user_id", "name", "review_count", "average_stars", "fans"]
    )
    print(f"  Loaded {len(user)} users")
    
    return business, review, user


def filter_city(business, review, source_city=SOURCE_CITY):
    """Filter businesses to source city only."""
    print(f"\nFiltering to {source_city}...")
    city_biz = business[business["city"].str.strip() == source_city].copy()
    print(f"  Found {len(city_biz)} businesses in {source_city}")
    
    # Filter reviews to only city businesses
    city_biz_ids = set(city_biz["business_id"])
    city_reviews = review[review["business_id"].isin(city_biz_ids)].copy()
    print(f"  Found {len(city_reviews)} reviews for {source_city} businesses")
    
    # Filter users to only those who reviewed city businesses
    city_user_ids = set(city_reviews["user_id"])
    
    return city_biz, city_reviews, city_user_ids


# Predefined Bengaluru area coordinates for nearest-area assignment
BENGALURU_AREA_COORDS = {
    "MG Road":           (12.9756, 77.6099),
    "Koramangala":       (12.9279, 77.6271),
    "Indiranagar":       (12.9784, 77.6408),
    "Electronic City":   (12.8458, 77.6603),
    "Jayanagar":         (12.9252, 77.5938),
    "Whitefield":        (12.9698, 77.7499),
    "HSR Layout":        (12.9116, 77.6389),
    "BTM Layout":        (12.9166, 77.6101),
    "Marathahalli":      (12.9591, 77.7010),
    "Sadashivanagar":    (13.0072, 77.5744),
    "JP Nagar":          (12.9063, 77.5850),
    "Rajajinagar":       (12.9921, 77.5538),
    "Malleshwaram":      (13.0038, 77.5715),
    "Basavanagudi":      (12.9429, 77.5748),
    "Hebbal":            (13.0350, 77.5970),
    "Yelahanka":         (13.1007, 77.5963),
    "Banashankari":      (12.9255, 77.5468),
    "Vijayanagar":       (12.9719, 77.5330),
    "Wilson Garden":     (12.9401, 77.5978),
    "Domlur":            (12.9609, 77.6387),
    "Bellandur":         (12.9257, 77.6767),
    "Sarjapur Road":     (12.9094, 77.6841),
    "Hennur":            (13.0452, 77.6384),
    "RT Nagar":          (13.0228, 77.5937),
    "Bannerghatta Road": (12.8880, 77.5970),
}


def remap_to_bengaluru(businesses):
    """Remap Philadelphia coordinates and areas to Bengaluru."""
    print("\nRemapping to Bengaluru...")
    
    # Shift coordinates to Bengaluru
    lat_offset = BLR_CENTER_LAT - PHL_CENTER_LAT
    lng_offset = BLR_CENTER_LNG - PHL_CENTER_LNG
    
    businesses["latitude"] = businesses["latitude"] + lat_offset
    businesses["longitude"] = businesses["longitude"] + lng_offset
    
    # Scale down to make area more compact (Bengaluru is smaller spread)
    businesses["latitude"] = BLR_CENTER_LAT + (businesses["latitude"] - BLR_CENTER_LAT) * 0.6
    businesses["longitude"] = BLR_CENTER_LNG + (businesses["longitude"] - BLR_CENTER_LNG) * 0.6
    
    # Assign each business to the nearest named Bengaluru area
    area_names = list(BENGALURU_AREA_COORDS.keys())
    area_lats = np.array([BENGALURU_AREA_COORDS[a][0] for a in area_names])
    area_lngs = np.array([BENGALURU_AREA_COORDS[a][1] for a in area_names])
    
    biz_lats = businesses["latitude"].values
    biz_lngs = businesses["longitude"].values
    
    # Compute distance from each business to each area center (vectorized)
    # Shape: (num_businesses, num_areas)
    lat_diffs = biz_lats[:, np.newaxis] - area_lats[np.newaxis, :]
    lng_diffs = biz_lngs[:, np.newaxis] - area_lngs[np.newaxis, :]
    distances = np.sqrt(lat_diffs**2 + lng_diffs**2)
    
    # Assign to nearest area
    nearest_idx = np.argmin(distances, axis=1)
    businesses["area"] = [area_names[i] for i in nearest_idx]
    
    # Update city
    businesses["city"] = "Bengaluru"
    
    area_counts = businesses["area"].value_counts()
    print(f"  Assigned businesses to {len(area_counts)} Bengaluru areas")
    print(f"  Areas: {area_counts.head(10).to_dict()}")
    
    return businesses


def engineer_features(businesses, reviews):
    """Create features for ML models."""
    print("\nEngineering features...")
    
    # 1. Success label
    businesses["is_successful"] = (
        (businesses["stars"] >= 4.0) &
        (businesses["review_count"] >= 50)
    ).astype(int)
    
    success_rate = businesses["is_successful"].mean() * 100
    print(f"  Success rate: {success_rate:.1f}%")
    
    # 2. Area statistics
    area_stats = businesses.groupby("area").agg(
        business_count=("business_id", "count"),
        avg_rating=("stars", "mean"),
        total_reviews=("review_count", "sum"),
        avg_review_count=("review_count", "mean"),
        success_rate=("is_successful", "mean"),
    ).reset_index()
    
    print(f"  Calculated stats for {len(area_stats)} areas")
    
    # 3. Category statistics
    businesses["primary_category"] = businesses["categories"].apply(
        lambda x: str(x).split(",")[0].strip() if pd.notna(x) else "Unknown"
    )
    
    # 4. Competitor count per area per primary category
    competitor_counts = businesses.groupby(["area", "primary_category"]).agg(
        competitor_count=("business_id", "count"),
        avg_competitor_rating=("stars", "mean"),
        total_area_category_reviews=("review_count", "sum"),
    ).reset_index()
    
    # Merge competitor info back
    businesses = businesses.merge(
        competitor_counts,
        on=["area", "primary_category"],
        how="left"
    )
    
    # 5. Review stats per business
    if len(reviews) > 0:
        review_stats = reviews.groupby("business_id").agg(
            avg_review_stars=("stars", "mean"),
            review_text_count=("text", "count"),
        ).reset_index()
        businesses = businesses.merge(review_stats, on="business_id", how="left")
    
    return businesses, area_stats


def create_user_item_matrix(reviews):
    """Create user-item rating matrix for collaborative filtering."""
    print("\nCreating user-item matrix...")
    
    # Limit to users with enough reviews for quality recommendations
    user_review_counts = reviews["user_id"].value_counts()
    active_users = user_review_counts[user_review_counts >= 3].index
    filtered_reviews = reviews[reviews["user_id"].isin(active_users)]
    
    print(f"  Active users (3+ reviews): {len(active_users)}")
    print(f"  Reviews from active users: {len(filtered_reviews)}")
    
    return filtered_reviews


def save_processed_data(businesses, reviews, user_ids, area_stats):
    """Save processed data to pickle files."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    businesses.to_pickle(os.path.join(OUTPUT_DIR, "processed_businesses.pkl"))
    reviews.to_pickle(os.path.join(OUTPUT_DIR, "processed_reviews.pkl"))
    area_stats.to_pickle(os.path.join(OUTPUT_DIR, "area_stats.pkl"))
    
    # Save user IDs
    with open(os.path.join(OUTPUT_DIR, "user_ids.pkl"), "wb") as f:
        pickle.dump(user_ids, f)
    
    print(f"\nSaved processed data to {OUTPUT_DIR}/")
    print(f"  processed_businesses.pkl: {len(businesses)} records")
    print(f"  processed_reviews.pkl: {len(reviews)} records")
    print(f"  area_stats.pkl: {len(area_stats)} records")


def main():
    # Load
    business, review, user = load_raw_data()
    
    # Filter to source city
    city_biz, city_reviews, city_user_ids = filter_city(business, review)
    
    # Free memory
    del business, review, user
    
    # Remap to Bengaluru
    city_biz = remap_to_bengaluru(city_biz)
    
    # Engineer features
    city_biz, area_stats = engineer_features(city_biz, city_reviews)
    
    # Create filtered reviews for collaborative filtering
    cf_reviews = create_user_item_matrix(city_reviews)
    
    # Save
    save_processed_data(city_biz, cf_reviews, city_user_ids, area_stats)
    
    print("\n✅ Data processing complete!")
    return city_biz, cf_reviews, area_stats


if __name__ == "__main__":
    main()
