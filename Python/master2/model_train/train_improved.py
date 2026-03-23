# ==================== 完整改进版 ====================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import tempfile
import os
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (RandomForestClassifier, GradientBoostingClassifier, 
                            HistGradientBoostingClassifier)
from xgboost import XGBClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                           f1_score, roc_auc_score, roc_curve, confusion_matrix,
                           classification_report)

# 设置临时目录避免编码问题
tempfile.tempdir = os.path.join(os.path.dirname(__file__), 'temp')
os.makedirs(tempfile.tempdir, exist_ok=True)

# ==================== 数据加载 ====================
# 这里假设你已经有数据，需要根据实际情况修改
# 示例：从文件加载
# data = pd.read_csv('diabetes.csv')
# X = data.drop('Outcome', axis=1)
# y = data['Outcome']
# X_cols = X.columns.tolist()
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 如果还没有数据，使用示例数据
from sklearn.datasets import load_breast_cancer
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target
X_cols = X.columns.tolist()
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, 
                                                    random_state=42, stratify=y)

# ==================== 模型定义 ====================
pipelines = {
    'Logistic Regression': Pipeline([
        ('scaler', StandardScaler()), 
        ('clf', LogisticRegression(random_state=42, max_iter=1000, solver='liblinear'))
    ]),
    'Random Forest': Pipeline([
        ('scaler', StandardScaler()), 
        ('clf', RandomForestClassifier(random_state=42, n_jobs=-1))
    ]),
    'Gradient Boosting': Pipeline([
        ('scaler', StandardScaler()), 
        ('clf', GradientBoostingClassifier(random_state=42))
    ]),
    'Hist Gradient Boosting': Pipeline([
        ('scaler', StandardScaler()), 
        ('clf', HistGradientBoostingClassifier(random_state=42))
    ])
}

# 检查XGBoost是否可用
try:
    pipelines['XGBoost'] = Pipeline([
        ('scaler', StandardScaler()), 
        ('clf', XGBClassifier(eval_metric='logloss', random_state=42, n_jobs=-1))
    ])
    xgboost_available = True
except:
    xgboost_available = False
    print("XGBoost not available, skipping...")

# ==================== 参数网格 ====================
param_grid = {
    'Logistic Regression': {
        'clf__C': [0.01, 0.1, 1, 10],
        'clf__penalty': ['l1', 'l2']
    },
    'Random Forest': {
        'clf__n_estimators': [100, 200],
        'clf__max_depth': [None, 10, 20],
        'clf__min_samples_split': [2, 5],
        'clf__max_features': ['sqrt', 'log2']
    },
    'Gradient Boosting': {
        'clf__n_estimators': [100, 200],
        'clf__learning_rate': [0.01, 0.1],
        'clf__max_depth': [3, 5],
        'clf__subsample': [0.8, 1.0]
    },
    'Hist Gradient Boosting': {
        'clf__max_iter': [100, 200],
        'clf__learning_rate': [0.01, 0.1],
        'clf__max_depth': [3, 5]
    }
}

if xgboost_available:
    param_grid['XGBoost'] = {
        'clf__n_estimators': [100, 200],
        'clf__learning_rate': [0.01, 0.1],
        'clf__max_depth': [3, 5],
        'clf__subsample': [0.8, 1.0]
    }

# ==================== 模型训练 ====================
best_models = {}
results = []
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for name, pipe in pipelines.items():
    print(f"\n{'='*50}")
    print(f"Training {name}...")
    print(f"{'='*50}")
    
    # 使用多进程加速，但避免编码问题
    try:
        grid = GridSearchCV(pipe, param_grid[name], cv=cv, 
                           scoring='f1', n_jobs=-1, verbose=1)
        grid.fit(X_train, y_train)
    except Exception as e:
        print(f"Error with parallel processing: {e}")
        print("Falling back to single process...")
        grid = GridSearchCV(pipe, param_grid[name], cv=cv, 
                           scoring='f1', n_jobs=1, verbose=1)
        grid.fit(X_train, y_train)

    best_models[name] = grid.best_estimator_
    
    # 预测
    y_pred = grid.predict(X_test)
    
    # 概率预测
    try:
        y_proba = grid.predict_proba(X_test)[:, 1]
        roc = roc_auc_score(y_test, y_proba)
    except:
        y_proba = None
        roc = np.nan
        print(f"Warning: {name} cannot predict probabilities")

    # 计算指标
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    results.append({
        'Model': name, 
        'BestParams': grid.best_params_, 
        'Accuracy': acc,
        'Precision': prec, 
        'Recall': rec, 
        'F1-Score': f1, 
        'ROC AUC': roc
    })

    # 打印结果
    print(f'\n----- {name} best model -----')
    print(f'best params: {grid.best_params_}')
    print(f'accuracy: {acc:.4f}')
    print(f'precision: {prec:.4f}')
    print(f'recall: {rec:.4f}')
    print(f'f1: {f1:.4f}')
    print(f'roc_auc: {roc:.4f}')
    print(classification_report(y_test, y_pred, digits=4))

    # 混淆矩阵
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6,4))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title(f'{name} Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.show()

    # ROC曲线
    if y_proba is not None:
        fpr, tpr, _ = roc_curve(y_test, y_proba)
        plt.figure(figsize=(6,4))
        plt.plot(fpr, tpr, label=f'ROC curve (AUC = {roc:.4f})')
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'{name} ROC Curve')
        plt.legend(loc='lower right')
        plt.show()

# ==================== 结果汇总 ====================
results_df = pd.DataFrame(results).sort_values('F1-Score', ascending=False)
print('\n' + '='*50)
print('综合排序结果:')
print('='*50)
print(results_df.to_string(index=False))

# ==================== 保存最佳模型 ====================
best_name = results_df.iloc[0]['Model']
best_model = best_models[best_name]

# 确保目录存在
os.makedirs('../report', exist_ok=True)
model_path = '../report/best_diabetes_model.pkl'
joblib.dump(best_model, model_path)
print(f'\n最佳模型已保存: {best_name} -> {model_path}')

# ==================== 预测函数 ====================
def predict_diabetes(input_dict, model_path='../report/best_diabetes_model.pkl'):
    """
    预测糖尿病
    
    Parameters:
    -----------
    input_dict : dict
        包含特征的字典
    model_path : str
        模型文件路径
    
    Returns:
    --------
    tuple : (预测标签, 预测概率)
    """
    # 检查模型文件是否存在
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")
    
    # 创建DataFrame
    sample = pd.DataFrame([input_dict])
    
    # 确保所有特征都存在
    missing_cols = set(X_cols) - set(sample.columns)
    if missing_cols:
        print(f"Warning: Missing columns {missing_cols}, filling with 0")
        for c in missing_cols:
            sample[c] = 0
    
    # 确保列顺序正确
    sample = sample[X_cols]
    
    # 预测
    try:
        label = model.predict(sample)[0]
    except Exception as e:
        raise ValueError(f'Prediction failed: {e}')
    
    # 获取概率
    prob = np.nan
    if hasattr(model, 'predict_proba'):
        prob = model.predict_proba(sample)[0, 1]
    elif hasattr(model, 'decision_function'):
        # 使用sigmoid函数转换decision function为概率
        decision = model.decision_function(sample)[0]
        prob = 1 / (1 + np.exp(-decision))
    
    return label, prob

# ==================== 测试预测 ====================
sample_input = {
    'Pregnancies': 2,
    'Glucose': 120,
    'BloodPressure': 70,
    'SkinThickness': 20,
    'Insulin': 80,
    'BMI': 28.0,
    'DiabetesPedigreeFunction': 0.5,
    'Age': 32
}

try:
    pred, prob = predict_diabetes(sample_input)
    print(f'\n示例预测:')
    print(f'输入: {sample_input}')
    print(f'预测标签: {pred}')
    print(f'预测概率: {prob:.4f}' if not np.isnan(prob) else f'预测概率: {prob}')
except Exception as e:
    print(f"Prediction failed: {e}")