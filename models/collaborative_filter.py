"""
Collaborative Filtering using truncated SVD (scipy) for personalized recommendations.
No dependency on scikit-surprise - uses scipy.sparse directly.
"""
import pickle
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from collections import defaultdict


class CollaborativeFilter:
    def __init__(self, n_factors=50):
        self.n_factors = n_factors
        self.trained = False
        self.user_idx = {}
        self.item_idx = {}
        self.idx_to_item = {}
        self.user_items = defaultdict(set)
        self.user_factors = None
        self.item_factors = None
        self.sigma = None
        self.global_mean = 0
        
    def train(self, reviews_df):
        """Train SVD model on user-business ratings."""
        print("Training Collaborative Filter (SVD via scipy)...")
        
        # Build index maps
        users = reviews_df["user_id"].unique()
        items = reviews_df["business_id"].unique()
        
        self.user_idx = {u: i for i, u in enumerate(users)}
        self.item_idx = {it: i for i, it in enumerate(items)}
        self.idx_to_item = {i: it for it, i in self.item_idx.items()}
        
        n_users = len(users)
        n_items = len(items)
        
        # Build sparse rating matrix
        row_indices = reviews_df["user_id"].map(self.user_idx).values
        col_indices = reviews_df["business_id"].map(self.item_idx).values
        ratings = reviews_df["stars"].values.astype(np.float32)
        
        self.global_mean = float(ratings.mean())
        
        rating_matrix = csr_matrix(
            (ratings - self.global_mean, (row_indices, col_indices)),
            shape=(n_users, n_items)
        )
        
        # Truncated SVD
        k = min(self.n_factors, min(n_users, n_items) - 1)
        U, sigma, Vt = svds(rating_matrix.astype(float), k=k)
        
        self.user_factors = U
        self.sigma = np.diag(sigma)
        self.item_factors = Vt.T  # items x factors
        
        # Store known items per user
        for _, row in reviews_df.iterrows():
            self.user_items[row["user_id"]].add(row["business_id"])
        
        self.trained = True
        print(f"  Trained on {n_users} users, {n_items} items, {k} factors")
        
    def _predict_rating(self, user_id, business_id):
        """Predict a single user-item rating."""
        if user_id not in self.user_idx or business_id not in self.item_idx:
            return self.global_mean
        
        u_idx = self.user_idx[user_id]
        i_idx = self.item_idx[business_id]
        
        pred = self.global_mean + self.user_factors[u_idx] @ self.sigma @ self.item_factors[i_idx]
        return float(np.clip(pred, 1.0, 5.0))
        
    def recommend(self, user_id, all_business_ids, n=10):
        """Get top-N recommendations for a user."""
        if not self.trained:
            raise ValueError("Model not trained yet")
        
        if user_id not in self.user_idx:
            return []
        
        # Get businesses user hasn't rated
        rated = self.user_items.get(user_id, set())
        candidates = [bid for bid in all_business_ids if bid not in rated and bid in self.item_idx]
        
        # Predict ratings for all candidates at once (vectorized)
        u_idx = self.user_idx[user_id]
        u_vec = self.user_factors[u_idx] @ self.sigma  # 1 x k
        
        predictions = []
        for bid in candidates:
            i_idx = self.item_idx[bid]
            pred = self.global_mean + u_vec @ self.item_factors[i_idx]
            predictions.append((bid, float(np.clip(pred, 1.0, 5.0))))
        
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n]
    
    def get_known_users(self):
        """Return list of known user IDs."""
        if not self.trained:
            return []
        return list(self.user_items.keys())
    
    def save(self, path):
        with open(path, "wb") as f:
            pickle.dump(self, f)
        print(f"  Saved collaborative filter to {path}")
    
    @staticmethod
    def load(path):
        with open(path, "rb") as f:
            return pickle.load(f)
