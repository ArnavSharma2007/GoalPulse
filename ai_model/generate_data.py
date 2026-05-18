"""
generate_data.py  — GoalPulse AI Model
Generates 50,000 synthetic training samples using a tightly correlated scoring formula.
Run: python generate_data.py
"""
import numpy as np
import pandas as pd
import random

random.seed(42)
np.random.seed(42)

def raw_score(uom_type, target, actual, target_date=None, actual_date=None):
    """Mirrors scoreCalculator.ts exactly."""
    if uom_type == 'numeric_min':
        if not actual or not target: return 0
        return min((actual / target) * 100, 150)
    elif uom_type == 'numeric_max':
        if not actual or not target: return 0
        return min((target / actual) * 100, 150)
    elif uom_type == 'timeline':
        if target_date is None or actual_date is None: return 0
        days_diff = actual_date - target_date
        if days_diff <= 0: return 100
        return max(100 - days_diff * 2, 0)
    elif uom_type == 'zero':
        return 100 if actual == 0 else 0
    return 0

def generate_goal_sheet():
    n_goals = random.randint(2, 8)
    weights_raw = [random.uniform(10, 40) for _ in range(n_goals)]
    total = sum(weights_raw)
    weights = [round(w / total * 100, 1) for w in weights_raw]
    weights[-1] = round(100 - sum(weights[:-1]), 1)

    uom_types = ['numeric_min', 'numeric_max', 'timeline', 'zero']
    q1_score = 0
    q2_score = 0
    final_score = 0
    features = {}

    for i, w in enumerate(weights):
        uom = random.choice(uom_types)
        target = random.uniform(100, 10000) if uom != 'zero' else 0
        
        # Optimized variance to simulate logical progression instead of pure randomness
        q1_pct = random.uniform(0.1, 0.8)
        q2_pct = random.uniform(q1_pct * 0.9, min(q1_pct * 1.2, 1.2))
        final_pct = random.uniform(q2_pct * 0.95, min(q2_pct * 1.1, 1.5))

        if uom == 'numeric_min':
            s_q1 = raw_score(uom, target, target * q1_pct)
            s_q2 = raw_score(uom, target, target * q2_pct)
            s_fin = raw_score(uom, target, target * final_pct)
        elif uom == 'numeric_max':
            s_q1 = raw_score(uom, target, target / max(q1_pct, 0.1))
            s_q2 = raw_score(uom, target, target / max(q2_pct, 0.1))
            s_fin = raw_score(uom, target, target / max(final_pct, 0.1))
        elif uom == 'timeline':
            q1_days = random.randint(-30, 15)
            q2_days = random.randint(q1_days - 5, q1_days + 10)
            fin_days = random.randint(q2_days - 5, q2_days + 10)
            s_q1 = raw_score(uom, None, None, target_date=0, actual_date=q1_days)
            s_q2 = raw_score(uom, None, None, target_date=0, actual_date=q2_days)
            s_fin = raw_score(uom, None, None, target_date=0, actual_date=fin_days)
        else:
            q1_act = random.choice([0, 0, 0, 1, 2])
            q2_act = random.choice([0, 0, 0, 1]) if q1_act > 0 else 0
            fin_act = random.choice([0, 0, 1]) if q2_act > 0 else 0
            s_q1 = raw_score(uom, 0, q1_act)
            s_q2 = raw_score(uom, 0, q2_act)
            s_fin = raw_score(uom, 0, fin_act)

        q1_score += (w / 100) * s_q1
        q2_score += (w / 100) * s_q2
        final_score += (w / 100) * s_fin

        features[f'goal_{i}_weight'] = w
        for u in uom_types:
            features[f'goal_{i}_uom_{u}'] = 1 if uom == u else 0
        features[f'goal_{i}_q1_score'] = s_q1
        features[f'goal_{i}_q2_score'] = s_q2

    features['n_goals'] = n_goals
    features['q1_weighted_score'] = q1_score
    features['q2_weighted_score'] = q2_score
    features['q1_q2_trend'] = q2_score - q1_score
    features['avg_q1q2'] = (q1_score + q2_score) / 2
    features['final_score'] = round(final_score, 2)
    return features

print("Generating 50,000 optimized training samples...")
rows = [generate_goal_sheet() for _ in range(50000)]
df = pd.DataFrame(rows).fillna(0)
df.to_csv('training_data.csv', index=False)
print(f"✅ Saved training_data.csv — shape: {df.shape}")
print(f"   Score range: {df['final_score'].min():.1f} – {df['final_score'].max():.1f}")