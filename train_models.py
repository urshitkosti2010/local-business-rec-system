"""
Train all ML models: Collaborative Filter, Content-Based Filter, Success Predictor.
"""
import os
import sys
import pandas as pd

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from models.collaborative_filter import CollaborativeFilter
from models.content_based import ContentBasedFilter
from models.success_predictor import BusinessSuccessPredictor
from data_processor import main as process_data

SAVE_DIR = os.path.join(os.path.dirname(__file__), "models", "saved")


def train_all():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    
    # Check if processed data exists, if not run processor
    if not os.path.exists(os.path.join(data_dir, "processed_businesses.pkl")):
        print("Processed data not found. Running data processor first...\n")
        process_data()
    
    # Load processed data
    print("\nLoading processed data...")
    businesses = pd.read_pickle(os.path.join(data_dir, "processed_businesses.pkl"))
    reviews = pd.read_pickle(os.path.join(data_dir, "processed_reviews.pkl"))
    print(f"  {len(businesses)} businesses, {len(reviews)} reviews")
    
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    # 1. Collaborative Filtering
    print("\n" + "="*60)
    cf = CollaborativeFilter()
    cf.train(reviews)
    cf.save(os.path.join(SAVE_DIR, "collaborative_filter.pkl"))
    
    # 2. Content-Based Filtering
    print("\n" + "="*60)
    cb = ContentBasedFilter()
    cb.train(businesses)
    cb.save(os.path.join(SAVE_DIR, "content_based.pkl"))
    
    # 3. Success Predictor
    print("\n" + "="*60)
    sp = BusinessSuccessPredictor()
    sp.train(businesses)
    sp.save(os.path.join(SAVE_DIR, "success_predictor.pkl"))
    
    print("\n" + "="*60)
    print("[OK] All models trained and saved!")
    print(f"   Models saved to: {SAVE_DIR}")


if __name__ == "__main__":
    train_all()
