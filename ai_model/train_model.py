"""
train_model.py  — GoalPulse AI Model
Trains an XGBoost Regressor with engineered features. Expected WMAPE < 15%.
Run: python train_model.py
"""
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score
import joblib
import json

print("Loading data and engineering features...")
df = pd.read_csv('training_data.csv')

# --- Feature Engineering ---
# Captures momentum trends across quarters
df['trend_acceleration'] = df['q2_weighted_score'] / (df['q1_weighted_score'] + 1e-5)
df['score_variance'] = df['avg_q1q2'] - df['q1_weighted_score']

X = df.drop('final_score', axis=1)
y = df['final_score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)
print(f"Train: {len(X_train)} | Test: {len(X_test)}")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Training XGBoost model (~1 min on CPU)...")
model = XGBRegressor(
    n_estimators=600,
    max_depth=7,
    learning_rate=0.03,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)
model.fit(X_train_scaled, y_train)

# Predict and clip output according to scoring bounds [0, 150]
y_pred = np.clip(model.predict(X_test_scaled), 0, 150)

# Metrics calculation
r2 = r2_score(y_test, y_pred)
mae = np.mean(np.abs(y_test - y_pred))

# Calculate WMAPE (Weighted MAPE) to safely handle zeros
wmape = np.sum(np.abs(y_test - y_pred)) / np.sum(y_test) * 100

print(f"\n{'='*40}")
print(f"📊 MODEL PERFORMANCE")
print(f"{'='*40}")
print(f"WMAPE: {wmape:.4f}% (Zero-Safe)")
print(f"MAE  : {mae:.4f} points")
print(f"R²   : {r2:.6f}")
print(f"{'='*40}")

if wmape < 15.0:  
    print("✅ TARGET MET: Model is predicting within acceptable variance.")
else:
    print("⚠️  WMAPE is high — consider hyperparameter tuning or adding more features.")

joblib.dump(model, 'model.joblib')
joblib.dump(scaler, 'scaler.joblib')
with open('feature_names.json', 'w') as f:
    json.dump(list(X.columns), f)

print(f"\n✅ Saved: model.joblib, scaler.joblib, feature_names.json")
print(f"   Feature count: {len(X.columns)}")