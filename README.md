\#  Local Business Recommendation System



A full-stack web application that recommends local businesses based on user preferences using machine learning.



\---



\##  Features



\*  Personalized business recommendations

\*  Fast backend using FastAPI

\*  Interactive frontend using React

\*  Content-based recommendation system



\---



\##  Tech Stack



\### Frontend



\* React

\* Tailwind CSS (if used)



\### Backend



\* FastAPI

\* Python



\### Machine Learning



\* Content-based filtering model



\---



\## 📁 Project Structure



local-business-rec-system/

│

├── backend/        # FastAPI backend

├── frontend/       # React frontend

├── models/         # ML models (excluded large files)

├── data/           # Dataset

├── requirements.txt

└── README.md



\---



\## ⚙️ Setup Instructions



\### 🔹 Backend Setup



```bash

cd backend

pip install -r requirements.txt

python -m uvicorn main:app --reload

```



\---



\### 🔹 Frontend Setup



```bash

cd frontend

npm install

npm start

```



\---



\##  Note



Large ML model files are excluded from the repository.

You can retrain the model using:



```bash

python train\_models.py

```



\---



\##  Future Improvements



\* Deploy on cloud (AWS / Vercel)

\* Add user authentication

\* Improve recommendation accuracy



\---



\##  Author



\*\*Urshit Kosti\*\*



