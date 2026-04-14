"""
Content-Based Filtering using TF-IDF + Cosine Similarity.
"""
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ContentBasedFilter:
    def __init__(self):
        self.tfidf = TfidfVectorizer(stop_words="english", max_features=5000)
        self.similarity_matrix = None
        self.business_ids = None
        self.trained = False
        
    def train(self, businesses_df):
        """Build TF-IDF similarity matrix from business features."""
        print("Training Content-Based Filter (TF-IDF)...")
        
        self.business_ids = businesses_df["business_id"].values
        self.business_id_to_idx = {
            bid: idx for idx, bid in enumerate(self.business_ids)
        }
        
        # Combine features into text
        features = businesses_df.apply(
            lambda r: f"{r.get('name', '')} {r.get('categories', '')} {r.get('area', '')}",
            axis=1
        ).fillna("")
        
        # TF-IDF vectorization
        tfidf_matrix = self.tfidf.fit_transform(features)
        
        # Compute cosine similarity
        self.similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
        self.trained = True
        
        print(f"  Built similarity matrix: {self.similarity_matrix.shape}")
        
    def get_similar(self, business_id, n=10):
        """Get top-N similar businesses."""
        if not self.trained:
            raise ValueError("Model not trained yet")
        
        if business_id not in self.business_id_to_idx:
            return []
        
        idx = self.business_id_to_idx[business_id]
        sim_scores = list(enumerate(self.similarity_matrix[idx]))
        sim_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Skip self (index 0)
        results = []
        for i, score in sim_scores[1:n+1]:
            results.append((self.business_ids[i], float(score)))
        
        return results
    
    def save(self, path):
        with open(path, "wb") as f:
            pickle.dump(self, f)
        print(f"  Saved content-based filter to {path}")
    
    @staticmethod
    def load(path):
        with open(path, "rb") as f:
            return pickle.load(f)
